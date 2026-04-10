param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [int]$MinimumCount = 500
)

$ErrorActionPreference = "Stop"

function Get-UsdaApiKey([string]$EnvPath) {
  if (-not (Test-Path $EnvPath)) {
    throw "Could not find .env file at $EnvPath"
  }

  foreach ($line in Get-Content -Path $EnvPath) {
    if ($line -match '^VITE_USDA_API_KEY=(.+)$') {
      return $Matches[1].Trim()
    }
  }

  throw "VITE_USDA_API_KEY was not found in $EnvPath"
}

function Normalize-Text([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }

  $normalized = $Value.ToLowerInvariant()
  $normalized = $normalized -replace '&', ' and '
  $normalized = $normalized -replace '[\u2019''"]', ''
  $normalized = $normalized -replace '\([^)]*\)', ' '
  $normalized = $normalized -replace '\[[^\]]*\]', ' '
  $normalized = $normalized -replace '\s+', ' '
  return $normalized.Trim(" ", ",", ";", "-", "/")
}

function Normalize-MatchText([string]$Value) {
  $normalized = Normalize-Text $Value
  $normalized = $normalized -replace '[,/\-]', ' '
  $normalized = $normalized -replace '\s+', ' '
  return $normalized.Trim()
}

function Get-SignificantTokens([string]$Value) {
  $stopWords = @(
    'and','or','with','without','raw','cooked','prepared','as','ingredient','plain','nfs','only',
    'dry','heat','boiled','drained','roasted','grilled','fried','fluid','lowfat','nonfat','whole',
    'small','medium','large','style','regular','fresh','ready','drink','from','recipe'
  )

  return @(
    (Normalize-MatchText $Value) -split ' ' |
    Where-Object { $_ -and $_.Length -gt 1 -and $_ -notin $stopWords }
  )
}

function Get-NutrientAmount($FoodNutrients, [string[]]$CandidateNames) {
  foreach ($candidate in $CandidateNames) {
    $matches = @($FoodNutrients | Where-Object {
      ($_.name -eq $candidate) -or ($_.nutrientName -eq $candidate)
    })

    if ($matches.Count -eq 0) {
      continue
    }

    $match = if ($candidate -like 'Energy*') {
      ($matches | Where-Object { $_.unitName -eq 'KCAL' } | Select-Object -First 1)
    } else {
      ($matches | Where-Object { $_.unitName -eq 'G' -or -not $_.unitName } | Select-Object -First 1)
    }

    if (-not $match) {
      $match = $matches | Select-Object -First 1
    }

    $amount = if ($null -ne $match.amount) { $match.amount } else { $match.value }
    if ($null -ne $amount) {
      return [math]::Round([double]$amount, 1)
    }
  }

  return 0
}

function Get-ServingSize($Food, $Seed) {
  if ($Seed.servingSize) {
    return $Seed.servingSize
  }

  if ($Food.servingSize -and $Food.servingSizeUnit) {
    $amount = [math]::Round([double]$Food.servingSize, 1)
    $unit = $Food.servingSizeUnit.ToString().ToLowerInvariant()
    return "$amount $unit"
  }

  return "100 g"
}

function Get-ServingWeightGrams($Food, $Seed) {
  if ($Seed.servingWeightGrams) {
    return [math]::Round([double]$Seed.servingWeightGrams, 1)
  }

  if ($Food.servingSize -and $Food.servingSizeUnit) {
    $unit = $Food.servingSizeUnit.ToString().ToLowerInvariant()
    if ($unit -match '^(g|gm|grm|gram|grams)$') {
      return [math]::Round([double]$Food.servingSize, 1)
    }
  }

  return $null
}

function Get-BaseUnit($Food, $Seed) {
  if ($Seed.baseUnit) {
    return $Seed.baseUnit
  }

  if ($Food.servingSize -and $Food.servingSizeUnit) {
    $unit = $Food.servingSizeUnit.ToString().ToLowerInvariant()
    if ($unit -match '^(piece|pieces|slice|slices|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|fl oz|serving|medium|large|small|container|pouch|package|biscuit|cookie|muffin|bar|patty|fillet|bun|egg|roll)$') {
      return "serving"
    }
  }

  return "100g"
}

function Merge-Aliases([string]$Name, [string[]]$Aliases) {
  $normalizedName = Normalize-Text $Name
  $set = New-Object System.Collections.Generic.HashSet[string]

  foreach ($alias in $Aliases) {
    $normalizedAlias = Normalize-Text $alias
    if ($normalizedAlias -and $normalizedAlias -ne $normalizedName) {
      $set.Add($normalizedAlias) | Out-Null
    }
  }

  return @($set | Select-Object -Unique)
}

function Invoke-UsdaSearch([string]$ApiKey, [string]$Query) {
  $encodedQuery = [System.Uri]::EscapeDataString($Query)
  $url = "https://api.nal.usda.gov/fdc/v1/foods/search?api_key=$ApiKey&query=$encodedQuery&pageSize=10"
  $response = Invoke-RestMethod -Uri $url
  return @($response.foods)
}

function Get-DataTypeRank($Seed, [string]$DataType) {
  $preparedKeywords = @(
    'salad','soup','sandwich','burger','pizza','pasta','noodles','curry','biryani','bowl','wrap',
    'stew','fried','macaroni','lasagna','dumplings','roll','taco','burrito','quesadilla',
    'enchilada','falafel','shawarma','kebab','paella','risotto','pilaf','omelet','omelette',
    'pancake','waffle','cookie','cake','pie','smoothie','shake','fries','hash browns',
    'nuggets','meatballs','ramen','udon','pho','ceviche','hummus','tabbouleh','ganoush',
    'moussaka','gnocchi','ravioli','pudding','custard'
  )
  $normalizedSeedName = Normalize-MatchText $Seed.name
  $isPreparedDish = @($preparedKeywords | Where-Object { $normalizedSeedName -like "*$_*" }).Count -gt 0

  if ($isPreparedDish) {
    switch ($DataType) {
      'Survey (FNDDS)' { return 0 }
      'Foundation' { return 1 }
      'SR Legacy' { return 2 }
      default { return 3 }
    }
  }

  switch ($DataType) {
    'Foundation' { return 0 }
    'SR Legacy' { return 1 }
    'Survey (FNDDS)' { return 2 }
    default { return 3 }
  }
}

function Select-BestSearchHit($Seed, $Foods) {
  $normalizedQuery = Normalize-MatchText $Seed.query
  $normalizedName = Normalize-MatchText $Seed.name
  $tokens = @($normalizedQuery -split ' ' | Where-Object { $_ })
  $significantTokens = Get-SignificantTokens $Seed.query

  $ranked = $Foods | ForEach-Object {
    $description = Normalize-MatchText $_.description
    $containsAllTokens = ($tokens.Count -gt 0) -and @($tokens | Where-Object { $description -notmatch "(^| )$($_)( |$)" }).Count -eq 0
    $matchedSignificantTokens = @($significantTokens | Where-Object { $description -match "(^| )$($_)( |$)" })
    $coverage = if ($significantTokens.Count -gt 0) {
      [double]$matchedSignificantTokens.Count / [double]$significantTokens.Count
    } else {
      1
    }

    $matchRank =
      if ($description -eq $normalizedQuery -or $description -eq $normalizedName) { 0 }
      elseif ($description.StartsWith($normalizedQuery) -or $description.StartsWith($normalizedName)) { 1 }
      elseif ($description.Contains($normalizedQuery) -or $description.Contains($normalizedName)) { 2 }
      elseif ($containsAllTokens) { 3 }
      else { 4 }

    if ($coverage -lt 0.5) {
      $matchRank += 50
    }

    $modifierPenalty = 0
    foreach ($modifier in @('dried', 'powder', 'mix', 'sweetened', 'sauce', 'with oil', 'with butter', 'with margarine', 'flavored', 'decaffeinated', 'dehydrated', 'canned')) {
      if ($description -like "*$modifier*") {
        $modifierPenalty += 1
      }
    }

    $officialPenalty =
      if ($_.dataType -in @('Foundation', 'SR Legacy', 'Survey (FNDDS)')) { 0 }
      else { 1 }
    $brandPenalty =
      if ($_.dataType -eq 'Branded' -or $_.brandOwner -or $_.brandName) { 1 }
      else { 0 }
    $typeRank = Get-DataTypeRank -Seed $Seed -DataType $_.dataType

    [pscustomobject]@{
      officialPenalty = $officialPenalty
      brandPenalty = $brandPenalty
      matchRank = $matchRank
      modifierPenalty = $modifierPenalty
      typeRank = $typeRank
      nameLength = $description.Length
      food = $_
    }
  } | Sort-Object officialPenalty, brandPenalty, matchRank, modifierPenalty, typeRank, nameLength

  $bestCandidate = $ranked | Select-Object -First 1
  if (-not $bestCandidate -or $bestCandidate.matchRank -ge 50) {
    return $null
  }

  return $bestCandidate.food
}

function Convert-ToEntry($Food, $Seed) {
  $aliases = Merge-Aliases $Seed.name @($Seed.aliases)
  $servingWeightGrams = Get-ServingWeightGrams $Food $Seed
  $entry = [ordered]@{
    name = Normalize-Text $Seed.name
    servingSize = Get-ServingSize $Food $Seed
    baseUnit = Get-BaseUnit $Food $Seed
    calories = Get-NutrientAmount $Food.foodNutrients @('Energy', 'Energy (Atwater General Factors)', 'Energy (Atwater Specific Factors)')
    protein = Get-NutrientAmount $Food.foodNutrients @('Protein')
    carbs = Get-NutrientAmount $Food.foodNutrients @('Carbohydrate, by difference')
    fat = Get-NutrientAmount $Food.foodNutrients @('Total lipid (fat)', 'Total fat (NLEA)')
  }

  if ($servingWeightGrams) {
    $entry.servingWeightGrams = $servingWeightGrams
  }

  if ($aliases.Count -gt 0) {
    $entry.aliases = $aliases
  }

  if (($entry.calories + $entry.protein + $entry.carbs + $entry.fat) -le 0) {
    return $null
  }

  return [pscustomobject]$entry
}

function Get-CommonFoodSeeds {
  $seedMap = @{}

  function Add-Seed {
    param(
      [string]$Name,
      [string]$Query = "",
      [string[]]$Aliases = @(),
      [string]$ServingSize = "",
      [string]$BaseUnit = "",
      [double]$ServingWeightGrams = 0
    )

    $normalizedName = Normalize-Text $Name
    if (-not $normalizedName) {
      return
    }

    $normalizedAliases = Merge-Aliases $normalizedName $Aliases
    $queryToUse = if ($Query) { $Query } else { $Name }

    if ($seedMap.ContainsKey($normalizedName)) {
      $existing = $seedMap[$normalizedName]
      if ($Query) { $existing.query = $queryToUse }
      if ($ServingSize) { $existing.servingSize = $ServingSize }
      if ($BaseUnit) { $existing.baseUnit = $BaseUnit }
      if ($ServingWeightGrams -gt 0) { $existing.servingWeightGrams = $ServingWeightGrams }
      $existing.aliases = Merge-Aliases $normalizedName (@($existing.aliases) + @($normalizedAliases))
      return
    }

    $seedMap[$normalizedName] = [pscustomobject]@{
      name = $normalizedName
      query = $queryToUse
      aliases = $normalizedAliases
      servingSize = $ServingSize
      baseUnit = $BaseUnit
      servingWeightGrams = if ($ServingWeightGrams -gt 0) { $ServingWeightGrams } else { $null }
    }
  }

  $rawFruits = @(
    'apple','banana','orange','mango','pineapple','papaya','watermelon','grapes','strawberry','blueberry','raspberry','blackberry','pear','peach','plum','kiwi','pomegranate','guava','cantaloupe','honeydew','avocado','lemon','lime','grapefruit','cherry','apricot','fig','dates','coconut','tangerine','clementine','nectarine','lychee','passion fruit','dragon fruit','jackfruit'
  )
  foreach ($name in $rawFruits) { Add-Seed -Name $name -Query "$name raw" }

  $fruitProducts = @(
    'raisins','dried mango','dried apricot','dried fig','prunes','applesauce','orange juice','apple juice','grape juice','pineapple juice','mango juice','cranberry juice','pomegranate juice','lemon juice','lime juice','coconut water','smoothie','fruit salad','fruit cup','mixed berries'
  )
  foreach ($name in $fruitProducts) { Add-Seed -Name $name }

  $rawVegetables = @(
    'tomato','cucumber','onion','carrot','broccoli','cauliflower','spinach','kale','cabbage','lettuce','arugula','bell pepper','chili pepper','mushroom','zucchini','eggplant','pumpkin','potato','sweet potato','corn','peas','green beans','asparagus','brussels sprouts','beetroot','radish','celery','okra','artichoke','garlic','ginger','bok choy','leeks','turnip','cassava','yam','taro','seaweed','mixed salad','olives','pickles'
  )
  foreach ($name in $rawVegetables) { Add-Seed -Name $name -Query "$name raw" }

  $vegetableDishes = @(
    'mashed potatoes','baked potato','boiled potato','roasted potatoes','french fries','hash browns','roasted sweet potato','corn on the cob','vegetable soup','tomato soup','mushroom soup','minestrone soup','stir fry vegetables','grilled vegetables','roasted carrots','steamed broccoli','steamed cauliflower','sauteed spinach','cabbage soup','pumpkin soup','coleslaw','caesar salad','greek salad','cobb salad','potato salad'
  )
  foreach ($name in $vegetableDishes) { Add-Seed -Name $name }

  $grainsAndStaples = @(
    'rice','white rice','brown rice','basmati rice','jasmine rice','wild rice','quinoa','couscous','bulgur','barley','farro','millet','oats','oatmeal','granola','cereal','cornflakes','muesli','granola cereal','popcorn','wheat flour','cornmeal','semolina','pasta','spaghetti','penne','macaroni','fusilli','noodles','ramen','udon','soba','rice noodles','vermicelli','bread','whole wheat bread','sourdough bread','pita bread','tortilla','naan','bagel','croissant','crackers','toast','chapati','roti','paratha','poha','upma','idli'
  )
  foreach ($name in $grainsAndStaples) { Add-Seed -Name $name }

  $legumesAndPlantProteins = @(
    'lentils','red lentils','green lentils','chickpeas','black beans','kidney beans','pinto beans','navy beans','cannellini beans','lima beans','mung beans','soybeans','edamame','split peas','baked beans','hummus','falafel','tofu','tempeh','dal','chana dal','rajma','chole','paneer','black eyed peas','refried beans','lentil soup','bean soup','chickpea curry','lentil curry','soy milk','almond milk','oat milk','peanut butter','almond butter'
  )
  foreach ($name in $legumesAndPlantProteins) { Add-Seed -Name $name }

  $dairyAndEggs = @(
    'milk','whole milk','skim milk','yogurt','greek yogurt','curd','cottage cheese','cream cheese','cheddar cheese','mozzarella cheese','parmesan cheese','swiss cheese','feta cheese','ricotta cheese','butter','ghee','sour cream','cream','kefir','buttermilk','ice cream','frozen yogurt','egg','egg white','egg yolk','boiled egg','scrambled eggs','omelet','fried egg','poached egg','hard boiled egg','soft boiled egg','cheese slice','vanilla ice cream','chocolate ice cream'
  )
  foreach ($name in $dairyAndEggs) { Add-Seed -Name $name }

  $animalProteins = @(
    'chicken','chicken breast','chicken thigh','chicken wing','roast chicken','grilled chicken','fried chicken','chicken nuggets','turkey','turkey breast','duck','beef','beef steak','ground beef','roast beef','hamburger patty','meatballs','pork','pork chop','bacon','ham','sausage','lamb','mutton','goat meat','liver','salmon','tuna','cod','tilapia','shrimp','prawn','crab','lobster','sardines','mackerel','anchovies','mussels','clams','oysters','fish fillet','grilled fish','fried fish','smoked salmon','beef curry','chicken curry','fish curry','shawarma','kebab','kofta','meatloaf','corned beef','pepperoni','hot dog','chicken sausage','beef burger patty','turkey burger','bolognese sauce','pulled pork','roast turkey','beef stew','chicken stew','fish stew'
  )
  foreach ($name in $animalProteins) { Add-Seed -Name $name }

  $beverages = @(
    'coffee','black coffee','espresso','cappuccino','latte','americano','tea','black tea','green tea','chai','milk tea','herbal tea','hot chocolate','lemonade','tomato juice','soda','cola','diet cola','sparkling water','beer','wine','red wine','white wine','protein shake','milkshake','iced coffee','orange juice drink','apple juice drink','grape juice drink','pineapple juice drink'
  )
  foreach ($name in $beverages) { Add-Seed -Name $name }

  $bakerySnacksDesserts = @(
    'jam toast','peanut butter toast','grilled cheese sandwich','peanut butter sandwich','chicken sandwich','tuna sandwich','club sandwich','pancake','waffle','french toast','muffin','blueberry muffin','chocolate muffin','donut','biscuit','cookie','chocolate chip cookie','oatmeal cookie','brownie','cheesecake','apple pie','cake','chocolate cake','carrot cake','pudding','custard','granola bar','protein bar','cereal bar','potato chips','tortilla chips','pretzels','trail mix','mixed nuts','samosa','spring roll','egg roll','dumplings','potstickers','empanada','popcorn chicken','onion rings','pizza','cheese pizza','pepperoni pizza','burger','cheeseburger','taco','burrito','quesadilla','enchilada','nachos','fried rice','egg fried rice','chicken fried rice','stir fry noodles','ramen bowl','pho','sushi','california roll','yogurt parfait','smoothie bowl','dark chocolate','candy bar','gummy candy','margherita pizza','chicken burger','fish burger','noodle bowl','wrap sandwich'
  )
  foreach ($name in $bakerySnacksDesserts) { Add-Seed -Name $name }

  $globalDishes = @(
    'biryani','chicken biryani','veg biryani','pulao','rice pilaf','risotto','paella','sushi roll','miso soup','pad thai','pad see ew','chow mein','lo mein','kimchi fried rice','bibimbap','bulgogi','teriyaki chicken','tempura','curry rice','butter chicken','tikka masala','dal tadka','dal makhani','rajma curry','chole masala','aloo gobi','paneer butter masala','palak paneer','paneer tikka','paneer bhurji','masala dosa','dosa','vada','sambar','rasam','khichdi','curd rice','lemon rice','tamarind rice','pav bhaji','vada pav','bhel puri','pani puri','pakora','shakshuka','hummus plate','falafel wrap','shawarma wrap','kebab wrap','tabbouleh','baba ganoush','moussaka','lasagna','spaghetti bolognese','spaghetti carbonara','macaroni and cheese','gnocchi','ravioli','pesto pasta','fettuccine alfredo','chicken alfredo','chili con carne','ceviche','arepa','tamale','jollof rice','couscous salad','tagine','shepherd pie','cottage pie','sloppy joe','breakfast burrito','burrito bowl','fajitas','taco salad','caesar salad wrap','chicken salad','tuna salad','noodle soup','chicken soup','lentil stew','vegetable stew','stuffed peppers','stuffed cabbage','meatball pasta','chicken pasta','tomato pasta','alfredo pasta','fried dumplings','wonton soup','hot and sour soup','ramen soup','udon soup','pho noodle soup','stir fry chicken','beef stir fry','vegetable stir fry','sweet and sour chicken','kung pao chicken','mapo tofu','fried noodles','egg noodles','chicken noodles','beef noodles','pad kra pao','satay','curry noodles','laksa','nasi goreng','mee goreng','yakisoba','okonomiyaki','takoyaki','goulash','pierogi','bratwurst','omelet sandwich','egg sandwich','chicken wrap','tuna wrap','falafel sandwich','grilled salmon bowl','chicken rice','hainanese chicken rice','fish and chips','burger and fries','meat curry','vegetable curry','potato curry','chickpea salad','quinoa salad','bean salad','pasta salad','macaroni salad','greek yogurt bowl','oatmeal bowl','porridge','meat kebab','chicken kebab'
  )
  foreach ($name in $globalDishes) { Add-Seed -Name $name }

  $seedOverrides = @{
    'apple' = @{ query = 'apple raw with skin'; aliases = @('apples') }
    'banana' = @{ query = 'banana raw'; aliases = @('bananas') }
    'blueberry' = @{ query = 'blueberries raw'; aliases = @('blueberries') }
    'cherry' = @{ query = 'cherries sweet raw'; aliases = @('cherries') }
    'orange' = @{ query = 'orange raw'; aliases = @('oranges') }
    'grapes' = @{ query = 'grapes raw'; aliases = @('grape') }
    'raspberry' = @{ query = 'raspberries raw'; aliases = @('raspberries') }
    'egg' = @{ query = 'eggs grade a large egg whole'; aliases = @('eggs'); servingSize = '1 large'; servingWeightGrams = 50 }
    'boiled egg' = @{ query = 'egg whole cooked hard-boiled'; aliases = @('hard boiled egg'); servingSize = '1 large'; servingWeightGrams = 50 }
    'hard boiled egg' = @{ query = 'egg whole cooked hard-boiled'; aliases = @('boiled egg'); servingSize = '1 large'; servingWeightGrams = 50 }
    'scrambled eggs' = @{ query = 'egg scrambled'; aliases = @('scrambled egg') }
    'omelet' = @{ query = 'omelet'; aliases = @('omelette') }
    'milk' = @{ query = 'milk lowfat fluid 1%'; aliases = @('cow milk') }
    'whole milk' = @{ query = 'milk whole fluid' }
    'skim milk' = @{ query = 'milk nonfat fluid' }
    'curd' = @{ query = 'yogurt plain'; aliases = @('yogurt','yoghurt') }
    'rice' = @{ query = 'rice white cooked as ingredient'; aliases = @('white rice') }
    'white rice' = @{ query = 'rice white cooked as ingredient' }
    'brown rice' = @{ query = 'rice brown cooked as ingredient' }
    'basmati rice' = @{ query = 'basmati rice cooked' }
    'jasmine rice' = @{ query = 'jasmine rice cooked' }
    'oats' = @{ query = 'oats rolled old fashioned'; aliases = @('rolled oats') }
    'oatmeal' = @{ query = 'oatmeal prepared with water' }
    'bread' = @{ query = 'bread white commercially prepared'; aliases = @('white bread') }
    'whole wheat bread' = @{ query = 'bread whole wheat commercially prepared' }
    'toast' = @{ query = 'bread toasted' }
    'coffee' = @{ query = 'coffee brewed' }
    'black coffee' = @{ query = 'coffee brewed' }
    'espresso' = @{ query = 'espresso coffee beverage' }
    'americano' = @{ query = 'coffee americano'; aliases = @('americano coffee') }
    'latte' = @{ query = 'coffee latte'; aliases = @('caffe latte') }
    'cappuccino' = @{ query = 'coffee cappuccino' }
    'tea' = @{ query = 'tea brewed' }
    'black tea' = @{ query = 'tea black brewed' }
    'green tea' = @{ query = 'green tea brewed' }
    'chai' = @{ query = 'masala chai'; aliases = @('chai tea') }
    'olives' = @{ query = 'olives pickled canned or bottled green' }
    'peanut butter' = @{ query = 'peanut butter creamy' }
    'tomato' = @{ query = 'tomatoes red ripe raw'; aliases = @('tomatoes') }
    'mushroom' = @{ query = 'mushrooms raw'; aliases = @('mushrooms') }
    'paneer' = @{ query = 'paneer'; aliases = @('cottage cheese') }
    'biryani' = @{ query = 'biryani' }
    'chicken biryani' = @{ query = 'biryani with chicken' }
    'veg biryani' = @{ query = 'biryani with vegetables' }
    'dal' = @{ query = 'dal'; aliases = @('lentil curry','lentils') }
    'chana dal' = @{ query = 'chana dal' }
    'rajma' = @{ query = 'kidney beans cooked'; aliases = @('rajma beans') }
    'chickpeas' = @{ query = 'chickpeas mature seeds cooked boiled without salt' }
    'chole' = @{ query = 'chickpeas mature seeds cooked boiled without salt'; aliases = @('chana') }
    'chicken' = @{ query = 'chicken cooked'; aliases = @('grilled chicken') }
    'chicken breast' = @{ query = 'chicken broilers fryers breast meat only cooked roasted'; aliases = @('chicken') }
    'chicken thigh' = @{ query = 'chicken thigh cooked roasted' }
    'grilled chicken' = @{ query = 'chicken grilled' }
    'fried chicken' = @{ query = 'chicken fried' }
    'turkey' = @{ query = 'turkey cooked'; aliases = @('turkey meat') }
    'turkey breast' = @{ query = 'turkey breast roasted' }
    'beef' = @{ query = 'beef lean cooked'; aliases = @('beef meat') }
    'beef steak' = @{ query = 'beef steak cooked' }
    'ground beef' = @{ query = 'beef ground cooked' }
    'hamburger patty' = @{ query = 'beef patty cooked' }
    'pork' = @{ query = 'pork cooked'; aliases = @('pork meat') }
    'pork chop' = @{ query = 'pork chop cooked' }
    'lamb' = @{ query = 'lamb cooked'; aliases = @('lamb meat') }
    'duck' = @{ query = 'duck cooked'; aliases = @('duck meat') }
    'goat meat' = @{ query = 'goat cooked' }
    'salmon' = @{ query = 'salmon cooked dry heat' }
    'tuna' = @{ query = 'tuna cooked dry heat' }
    'cod' = @{ query = 'cod cooked dry heat' }
    'tilapia' = @{ query = 'tilapia cooked dry heat' }
    'shrimp' = @{ query = 'shrimp cooked moist heat' }
    'prawn' = @{ query = 'prawns cooked'; aliases = @('prawns') }
    'fish fillet' = @{ query = 'fish fillet cooked' }
    'grilled fish' = @{ query = 'fish grilled' }
    'fried fish' = @{ query = 'fish fried' }
    'roti' = @{ query = 'bread chapati or roti plain commercially prepared' }
    'chapati' = @{ query = 'bread chapati or roti plain commercially prepared'; aliases = @('chapatti') }
    'hot dog' = @{ query = 'hot dog on bun' }
    'burger' = @{ query = 'hamburger on bun' }
    'cheeseburger' = @{ query = 'cheeseburger on bun' }
    'pizza' = @{ query = 'pizza cheese' }
    'cheese pizza' = @{ query = 'pizza cheese' }
    'margherita pizza' = @{ query = 'pizza margherita' }
    'pepperoni pizza' = @{ query = 'pizza pepperoni' }
    'french fries' = @{ query = 'potatoes french fried'; aliases = @('fries') }
    'hash browns' = @{ query = 'potatoes hash browns' }
    'smoothie' = @{ query = 'fruit smoothie' }
    'protein shake' = @{ query = 'protein shake' }
  }

  foreach ($key in $seedOverrides.Keys) {
    $override = $seedOverrides[$key]
    Add-Seed -Name $key -Query $override.query -Aliases $override.aliases -ServingSize $override.servingSize -BaseUnit $override.baseUnit -ServingWeightGrams $override.servingWeightGrams
  }

  return @($seedMap.Values | Sort-Object name)
}

$projectRootPath = Resolve-Path $ProjectRoot
$envPath = Join-Path $projectRootPath ".env"
$outputPath = Join-Path $projectRootPath "src\data\localFoods.json"
$apiKey = Get-UsdaApiKey $envPath
$excludedSeedNames = @('americano', 'beef burger patty', 'fish burger', 'kebab wrap', 'shawarma wrap')
$seeds = @(Get-CommonFoodSeeds | Where-Object { $_.name -notin $excludedSeedNames })

$entries = New-Object System.Collections.Generic.List[object]

foreach ($seed in $seeds) {
  try {
    $foods = Invoke-UsdaSearch -ApiKey $apiKey -Query $seed.query
    if ($foods.Count -eq 0) {
      Write-Warning "No USDA result for $($seed.name)"
      continue
    }

    $bestMatch = Select-BestSearchHit -Seed $seed -Foods $foods
    if (-not $bestMatch) {
      Write-Warning "No ranked USDA result for $($seed.name)"
      continue
    }

    $entry = Convert-ToEntry -Food $bestMatch -Seed $seed
    if (-not $entry) {
      Write-Warning "Skipped $($seed.name) because USDA macros were empty"
      continue
    }

    $entries.Add($entry) | Out-Null
  } catch {
    Write-Warning "Skipping $($seed.name): $($_.Exception.Message)"
  }
}

$finalEntries = @($entries | Sort-Object name)

if ($finalEntries.Count -lt $MinimumCount) {
  throw "Generated only $($finalEntries.Count) common foods. Minimum required is $MinimumCount."
}

$json = $finalEntries | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($outputPath, $json + [Environment]::NewLine, [System.Text.Encoding]::UTF8)

Write-Host "Wrote $($finalEntries.Count) common USDA-backed foods to $outputPath"
