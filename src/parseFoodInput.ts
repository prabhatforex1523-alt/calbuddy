export type ParsedFoodInput = {
  quantity: number;
  unit: string;
  foodName: string;
};

const UNIT_PATTERN =
  "(?:pieces?|pcs?|piece|grams?|g|kg|cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|ml|servings?|serving)";

const normalizeCompactFoodText = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .replace(
      new RegExp(`\\b(${UNIT_PATTERN})(?=[a-z])`, "gi"),
      "$1 "
    )
    .replace(/\s+/g, " ")
    .trim();

const normalizeUnit = (unit: string) => {
  const u = unit.toLowerCase().trim();

  if (["g", "gram", "grams"].includes(u)) return "grams";
  if (["kg", "kilogram", "kilograms"].includes(u)) return "kg";
  if (["piece", "pieces", "pc", "pcs"].includes(u)) return "pieces";
  if (["cup", "cups"].includes(u)) return "cup";
  if (["tbsp", "tablespoon", "tablespoons"].includes(u)) return "tbsp";
  if (["tsp", "teaspoon", "teaspoons"].includes(u)) return "tsp";
  if (["ml", "milliliter", "milliliters"].includes(u)) return "ml";
  if (["serving", "servings"].includes(u)) return "serving";

  return u;
};

export const parseFoodInput = (input: string): ParsedFoodInput => {
  const text = normalizeCompactFoodText(input);

  if (!text) {
    return {
      quantity: 1,
      unit: "serving",
      foodName: "",
    };
  }

  // half apple
  const halfMatch = text.match(/^half\s+(.+)$/i);
  if (halfMatch) {
    return {
      quantity: 0.5,
      unit: "pieces",
      foodName: halfMatch[1].trim(),
    };
  }

  // 100g biryani
  const compactGramMatch = text.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml)\s*(.+)$/i);
  if (compactGramMatch) {
    return {
      quantity: parseFloat(compactGramMatch[1]),
      unit: normalizeUnit(compactGramMatch[2]),
      foodName: compactGramMatch[3].trim(),
    };
  }

  // 2 eggs / 1 cup milk / 250 grams rice
  const fullMatch = text.match(
    /^(\d+(?:\.\d+)?)\s+(pieces?|pcs?|piece|grams?|g|kg|cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|ml|servings?|serving)\s+(.+)$/i
  );

  if (fullMatch) {
    return {
      quantity: parseFloat(fullMatch[1]),
      unit: normalizeUnit(fullMatch[2]),
      foodName: fullMatch[3].trim(),
    };
  }

  // 2 egg  -> assume pieces
  const numberFoodMatch = text.match(/^(\d+(?:\.\d+)?)\s+(.+)$/i);
  if (numberFoodMatch) {
    return {
      quantity: parseFloat(numberFoodMatch[1]),
      unit: "pieces",
      foodName: numberFoodMatch[2].trim(),
    };
  }

  // default
  return {
    quantity: 1,
    unit: "serving",
    foodName: text,
  };
};
export const parseMultiFoodInput = (input: string) => {
  const cleaned = normalizeCompactFoodText(input)
    .replace(/\s+with\s+/gi, " and ")
    .trim();

  const directParts = cleaned
    .split(/\s*(?:,|\+|and)\s*/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (directParts.length > 1) {
    return directParts;
  }

  const matches = cleaned.match(
    new RegExp(
      `\\d+(?:\\.\\d+)?\\s*(?:${UNIT_PATTERN})?\\s+[a-zA-Z][a-zA-Z\\s-]*?(?=\\s+\\d+(?:\\.\\d+)?(?:\\s*(?:${UNIT_PATTERN}))?\\s+[a-zA-Z]|$)`,
      "gi"
    )
  );

  if (matches && matches.length > 0) {
    return matches.map((item) => item.trim());
  }

  return [cleaned];
};
