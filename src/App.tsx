/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Minus,
  Utensils, 
  Droplets, 
  Flame, 
  TrendingUp, 
  Camera, 
  Image,
  Search,
  ChevronRight,
  History,
  Settings as SettingsIcon,
  X,
  Loader2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Circle,
  PlusCircle,
  Sparkles,
  Brain,
  Moon as MoonIcon,
  Sun as SunIcon,
  Coffee,
  Heart,
  Dumbbell,
  Scale
} from 'lucide-react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

import { FoodEntry, ActivityEntry, WaterEntry, UserProfile, HealthData, Habit, HabitLog, WeightEntry, BoxColors } from './types';
import { analyzeFood } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const HabitIcon = ({ name, size = 20, className = "", color }: { name: string, size?: number, className?: string, color?: string }) => {
  const icons: Record<string, any> = {
    Brain,
    Coffee,
    Moon: MoonIcon,
    Sun: SunIcon,
    Heart,
    Dumbbell,
    Sparkles,
    Utensils,
    Droplets,
    CheckCircle2,
    Circle,
    PlusCircle,
    Flame,
    Scale,
    TrendingUp
  };
  const Icon = icons[name] || Sparkles;
  return <Icon size={size} className={className} style={color ? { color } : undefined} />;
};

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { damping: 25, stiffness: 150 });
  const displayValue = useTransform(springValue, (current) => Math.round(current));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span>{displayValue}</motion.span>;
}

const INITIAL_PROFILE: UserProfile = {
  name: 'User',
  dailyCalorieGoal: 2000,
  dailyWaterGoalMl: 2500,
  weightGoal: 70,
  currentWeight: 75,
  weightUnit: 'kg',
  macroUnit: 'g',
  primaryColor: '#ec4899',
  cardColor: '#ffffff',
  darkCardColor: '#0f172a',
  boxColors: {
    summary: '#ffffff',
    water: '#f0f9ff',
    food: '#fef2f2',
    activity: '#f0fdf4',
    habits: '#fdf4ff',
    weight: '#fffbeb'
  },
  darkBoxColors: {
    summary: '#0f172a',
    water: '#082f49',
    food: '#450a0a',
    activity: '#052e16',
    habits: '#3b0764',
    weight: '#422006'
  },
  wallpaperUrl: '',
  wallpaperOpacity: 1,
  wallpaperBlur: 0
};

const generatePlaceholderData = (): HealthData => {
  const now = new Date();
  const foodEntries: FoodEntry[] = [];
  const activityEntries: ActivityEntry[] = [];
  const waterEntries: WaterEntry[] = [];
  const weightEntries: WeightEntry[] = [];
  const habitLogs: HabitLog[] = [];

  const habits = [
    { id: '1', name: 'Morning Meditation', icon: 'Brain', color: '#8b5cf6' },
    { id: '2', name: 'Read for 30 mins', icon: 'Coffee', color: '#f59e0b' },
    { id: '3', name: '8 Hours Sleep', icon: 'Moon', color: '#3b82f6' }
  ];

  let currentWeight = 76.5;

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const timestamp = date.getTime();

    // Food
    foodEntries.push({
      id: crypto.randomUUID(),
      name: 'Oatmeal with Berries',
      calories: 350,
      protein: 12,
      carbs: 60,
      fat: 6,
      timestamp: new Date(date.setHours(8, 0, 0, 0)).getTime(),
      mealType: 'breakfast'
    });
    foodEntries.push({
      id: crypto.randomUUID(),
      name: 'Grilled Chicken Salad',
      calories: 450,
      protein: 40,
      carbs: 15,
      fat: 20,
      timestamp: new Date(date.setHours(13, 0, 0, 0)).getTime(),
      mealType: 'lunch'
    });
    foodEntries.push({
      id: crypto.randomUUID(),
      name: 'Salmon and Quinoa',
      calories: 600,
      protein: 45,
      carbs: 40,
      fat: 25,
      timestamp: new Date(date.setHours(19, 0, 0, 0)).getTime(),
      mealType: 'dinner'
    });
    foodEntries.push({
      id: crypto.randomUUID(),
      name: 'Whey Protein Shake',
      calories: 120,
      protein: 24,
      carbs: 3,
      fat: 1,
      timestamp: new Date(date.setHours(16, 0, 0, 0)).getTime(),
      mealType: 'snack'
    });

    // Activity
    if (i % 2 === 0) {
      activityEntries.push({
        id: crypto.randomUUID(),
        name: 'Weightlifting',
        caloriesBurned: 300,
        durationMinutes: 45,
        intensity: 'High',
        timestamp: new Date(date.setHours(17, 0, 0, 0)).getTime()
      });
    } else {
      activityEntries.push({
        id: crypto.randomUUID(),
        name: 'Brisk Walk',
        caloriesBurned: 150,
        durationMinutes: 30,
        intensity: 'Low',
        timestamp: new Date(date.setHours(7, 30, 0, 0)).getTime()
      });
    }

    // Water
    waterEntries.push({
      id: crypto.randomUUID(),
      amountMl: 2000 + Math.floor(Math.random() * 500),
      timestamp: new Date(date.setHours(20, 0, 0, 0)).getTime()
    });

    // Habits
    if (Math.random() > 0.2) habitLogs.push({ id: crypto.randomUUID(), habitId: '1', timestamp });
    if (Math.random() > 0.3) habitLogs.push({ id: crypto.randomUUID(), habitId: '2', timestamp });
    if (Math.random() > 0.1) habitLogs.push({ id: crypto.randomUUID(), habitId: '3', timestamp });

    // Weight
    currentWeight -= (Math.random() * 0.2);
    weightEntries.push({
      id: crypto.randomUUID(),
      weight: parseFloat(currentWeight.toFixed(1)),
      timestamp: new Date(date.setHours(6, 0, 0, 0)).getTime()
    });
  }

  return {
    foodEntries,
    activityEntries,
    waterEntries,
    weightEntries,
    habits,
    habitLogs,
    profile: {
      ...INITIAL_PROFILE,
      currentWeight: parseFloat(currentWeight.toFixed(1))
    }
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'habits' | 'activity' | 'weight' | 'profile'>('today');
  const [data, setData] = useState<HealthData>(() => {
    const saved = localStorage.getItem('calbuddy_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Ensure profile exists
        if (!parsed.profile) {
          parsed.profile = { ...INITIAL_PROFILE };
        }
        
        // Migration for profile properties
        if (!parsed.profile.weightUnit) {
          parsed.profile.weightUnit = 'kg';
        }
        if (!parsed.profile.macroUnit) {
          parsed.profile.macroUnit = 'g';
        }
        if (!parsed.profile.primaryColor) {
          parsed.profile.primaryColor = '#ec4899';
        }
        if (!parsed.profile.cardColor) {
          parsed.profile.cardColor = '#ffffff';
        }
        if (!parsed.profile.darkCardColor) {
          parsed.profile.darkCardColor = '#0f172a';
        }
        if (!parsed.profile.boxColors) {
          parsed.profile.boxColors = { ...INITIAL_PROFILE.boxColors };
        }
        if (!parsed.profile.darkBoxColors) {
          parsed.profile.darkBoxColors = { ...INITIAL_PROFILE.darkBoxColors };
        }
        if (parsed.profile.wallpaperUrl === undefined) {
          parsed.profile.wallpaperUrl = '';
        }
        if (parsed.profile.wallpaperOpacity === undefined) {
          parsed.profile.wallpaperOpacity = 1;
        }
        if (parsed.profile.wallpaperBlur === undefined) {
          parsed.profile.wallpaperBlur = 0;
        }

        if (!parsed.habits) {
          parsed.habits = [
            { id: '1', name: 'Morning Meditation', icon: 'Brain', color: '#8b5cf6' },
            { id: '2', name: 'Read for 30 mins', icon: 'Coffee', color: '#f59e0b' },
            { id: '3', name: '8 Hours Sleep', icon: 'Moon', color: '#3b82f6' }
          ];
        }
        if (!parsed.habitLogs) {
          parsed.habitLogs = [];
        }
        if (!parsed.weightEntries) {
          parsed.weightEntries = [];
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing saved data", e);
      }
    }
    return generatePlaceholderData();
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('calbuddy_dark_mode');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('calbuddy_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    if (!data?.profile) return;
    const primaryColor = data.profile.primaryColor || '#ec4899';
    const root = document.documentElement;
    
    // Simple shade generation
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [236, 72, 153];
    };

    const [r, g, b] = hexToRgb(primaryColor);
    
    root.style.setProperty('--brand-500', primaryColor);
    root.style.setProperty('--brand-50', `rgba(${r}, ${g}, ${b}, 0.05)`);
    root.style.setProperty('--brand-100', `rgba(${r}, ${g}, ${b}, 0.1)`);
    root.style.setProperty('--brand-600', `rgba(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}, 1)`);
    root.style.setProperty('--brand-700', `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 1)`);
  }, [data.profile?.primaryColor]);

  useEffect(() => {
    if (!data?.profile) return;
    
    const cardColor = isDarkMode 
      ? (data.profile.darkCardColor || '#0f172a')
      : (data.profile.cardColor || '#ffffff');
      
    const root = document.documentElement;
    
    // Convert hex to rgba for the background
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [255, 255, 255];
    };

    const [r, g, b] = hexToRgb(cardColor);
    root.style.setProperty('--card-bg', `rgba(${r}, ${g}, ${b}, ${isDarkMode ? 0.6 : 0.8})`);
    
    // Generate a slightly darker border color
    const borderR = Math.max(0, r - 20);
    const borderG = Math.max(0, g - 20);
    const borderB = Math.max(0, b - 20);
    root.style.setProperty('--card-border', `rgba(${borderR}, ${borderG}, ${borderB}, ${isDarkMode ? 0.5 : 0.3})`);

    // Generate colors for individual boxes
    const sections = ['summary', 'water', 'food', 'activity', 'habits', 'weight'] as const;
    sections.forEach(section => {
      const sectionColor = isDarkMode
        ? (data.profile.darkBoxColors?.[section] || data.profile.darkCardColor || '#0f172a')
        : (data.profile.boxColors?.[section] || data.profile.cardColor || '#ffffff');
      
      const [sr, sg, sb] = hexToRgb(sectionColor);
      root.style.setProperty(`--card-bg-${section}`, `rgba(${sr}, ${sg}, ${sb}, ${isDarkMode ? 0.6 : 0.8})`);
      
      const sBorderR = Math.max(0, sr - 20);
      const sBorderG = Math.max(0, sg - 20);
      const sBorderB = Math.max(0, sb - 20);
      root.style.setProperty(`--card-border-${section}`, `rgba(${sBorderR}, ${sBorderG}, ${sBorderB}, ${isDarkMode ? 0.5 : 0.3})`);
    });
  }, [data.profile?.cardColor, data.profile?.darkCardColor, data.profile?.boxColors, data.profile?.darkBoxColors, isDarkMode]);

  useEffect(() => {
    if (!data?.profile) return;
    const { wallpaperUrl, wallpaperOpacity = 1, wallpaperBlur = 0 } = data.profile;
    const root = document.documentElement;
    
    if (wallpaperUrl) {
      root.style.setProperty('--wallpaper-url', `url(${wallpaperUrl})`);
      root.style.setProperty('--wallpaper-opacity', wallpaperOpacity.toString());
      root.style.setProperty('--wallpaper-blur', `${wallpaperBlur}px`);
      document.body.style.backgroundImage = 'none';
    } else {
      root.style.setProperty('--wallpaper-url', 'none');
      // Reset to default gradient if no wallpaper
      const primaryColor = data.profile.primaryColor || '#ec4899';
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [236, 72, 153];
      };
      const [r, g, b] = hexToRgb(primaryColor);
      
      if (isDarkMode) {
        document.body.style.backgroundImage = `radial-gradient(circle at 0% 0%, rgba(${r}, ${g}, ${b}, 0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)`;
      } else {
        document.body.style.backgroundImage = `radial-gradient(circle at 0% 0%, rgba(${r}, ${g}, ${b}, 0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.04) 0%, transparent 50%)`;
      }
    }
  }, [data.profile?.wallpaperUrl, data.profile?.wallpaperOpacity, data.profile?.wallpaperBlur, data.profile?.primaryColor, isDarkMode]);

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image is too large. Please select an image under 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          // Compress image using canvas
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions for wallpaper to keep localStorage size manageable
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Use lower quality for JPEG to save space
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            setData(prev => ({
              ...prev,
              profile: {
                ...prev.profile,
                wallpaperUrl: compressedDataUrl
              }
            }));
            showToast("Wallpaper updated!");
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeWallpaper = () => {
    setData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        wallpaperUrl: ''
      }
    }));
  };

  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityEntry | null>(null);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAddWaterOpen, setIsAddWaterOpen] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [isSyncing, setIsSyncing] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [activityInput, setActivityInput] = useState({ name: '', calories: '', duration: '', intensity: 'Medium' as 'Low' | 'Medium' | 'High' });
  const [waterInput, setWaterInput] = useState({ amount: '', caloriesConsumed: '', caloriesBurned: '' });
  const [habitInput, setHabitInput] = useState({ name: '', icon: 'Sparkles', color: '#10b981' });

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitInput.name) return;

    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: habitInput.name,
      icon: habitInput.icon,
      color: habitInput.color
    };

    setData(prev => ({
      ...prev,
      habits: [...prev.habits, newHabit]
    }));
    setHabitInput({ name: '', icon: 'Sparkles', color: '#10b981' });
    setIsAddHabitOpen(false);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityInput.name || !activityInput.calories) return;

    if (editingActivity) {
      setData(prev => ({
        ...prev,
        activityEntries: prev.activityEntries.map(entry => 
          entry.id === editingActivity.id 
            ? { 
                ...entry, 
                name: activityInput.name, 
                caloriesBurned: parseInt(activityInput.calories),
                durationMinutes: parseInt(activityInput.duration) || 30,
                intensity: activityInput.intensity
              } 
            : entry
        )
      }));
      setEditingActivity(null);
    } else {
      const newEntry: ActivityEntry = {
        id: crypto.randomUUID(),
        name: activityInput.name,
        caloriesBurned: parseInt(activityInput.calories),
        durationMinutes: parseInt(activityInput.duration) || 30,
        intensity: activityInput.intensity,
        timestamp: selectedDate.getTime()
      };
      setData(prev => ({
        ...prev,
        activityEntries: [newEntry, ...prev.activityEntries]
      }));
    }
    setActivityInput({ name: '', calories: '', duration: '', intensity: 'Medium' });
    setIsAddActivityOpen(false);
  };
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [foodInput, setFoodInput] = useState('');
  const [foodQuantity, setFoodQuantity] = useState<string>('1');
  const [foodUnit, setFoodUnit] = useState<string>('serving');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const goalsMetRef = useRef({ calories: false, water: false });

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Camera access denied. Please ensure you have allowed camera permissions in your browser settings and that no other app is using the camera.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
    
    stopCamera();
    setIsAddFoodOpen(false);
    setIsAnalyzing(true);

    try {
      const result = await analyzeFood({ base64, mimeType: 'image/jpeg' });
      
      const newEntry: FoodEntry = {
        id: crypto.randomUUID(),
        ...result,
        timestamp: selectedDate.getTime(),
        mealType: mealType
      };
      
      setData(prev => ({
        ...prev,
        foodEntries: [newEntry, ...prev.foodEntries]
      }));
    } catch (err) {
      console.error('Error analyzing image:', err);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeFood({ base64, mimeType: file.type });
          
          const newEntry: FoodEntry = {
            id: crypto.randomUUID(),
            ...result,
            timestamp: selectedDate.getTime(),
            mealType: mealType
          };
          
          setData(prev => ({
            ...prev,
            foodEntries: [newEntry, ...prev.foodEntries]
          }));
          setIsAddFoodOpen(false);
        } catch (err) {
          console.error('Error analyzing image:', err);
          alert('Failed to analyze image. Please try again or use text input.');
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read image:', error);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('calbuddy_data', JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save data to localStorage", e);
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        showToast("Storage full! Try removing some data or wallpaper.");
      }
    }
  }, [data]);

  const handleSync = () => {
    setIsSyncing(true);
    showToast('Syncing with cloud...');
    // Simulate cloud sync
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Health data synced successfully!');
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#db2777', '#2563eb', '#059669'],
        gravity: 0.8,
        scalar: 1.2
      });
    }, 2000);
  };

  const calculateStreak = (habitId: string) => {
    if (!data?.habitLogs) return 0;
    const logs = data.habitLogs
      .filter(log => log.habitId === habitId)
      .map(log => startOfDay(new Date(log.timestamp)).getTime())
      .sort((a, b) => b - a);

    if (logs.length === 0) return 0;

    const uniqueLogs = Array.from(new Set(logs));
    let streak = 0;
    let currentDate = startOfDay(new Date());

    const completedToday = uniqueLogs[0] === currentDate.getTime();
    
    if (!completedToday) {
      currentDate.setDate(currentDate.getDate() - 1);
      if (uniqueLogs[0] !== currentDate.getTime()) {
        return 0;
      }
    }

    for (let i = 0; i < uniqueLogs.length; i++) {
      if (uniqueLogs[i] === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const dailyStats = useMemo(() => {
    const dayFood = (data.foodEntries || []).filter(e => isSameDay(new Date(e.timestamp), selectedDate));
    const dayActivity = (data.activityEntries || []).filter(e => isSameDay(new Date(e.timestamp), selectedDate));
    const dayWater = (data.waterEntries || []).filter(e => isSameDay(new Date(e.timestamp), selectedDate));
    const dayHabitLogs = (data.habitLogs || []).filter(e => isSameDay(new Date(e.timestamp), selectedDate));

    const consumed = dayFood.reduce((acc, curr) => acc + (curr.calories || 0), 0) + 
                     dayWater.reduce((acc, curr) => acc + (curr.caloriesConsumed || 0), 0);
    const burned = dayActivity.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0) + 
                   dayWater.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0);
    const water = Math.max(0, dayWater.reduce((acc, curr) => acc + (curr.amountMl || 0), 0));
    
    const protein = dayFood.reduce((acc, curr) => acc + (curr.protein || 0), 0);
    const carbs = dayFood.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
    const fat = dayFood.reduce((acc, curr) => acc + (curr.fat || 0), 0);

    const filteredFood = dayFood.filter(entry => 
      (entry.name || "").toLowerCase().includes((foodSearchQuery || "").toLowerCase()) ||
      (entry.mealType || "").toLowerCase().includes((foodSearchQuery || "").toLowerCase())
    );

    const habitCompletion = (data.habits || []).map(habit => ({
      ...habit,
      completed: dayHabitLogs.some(log => log.habitId === habit.id),
      streak: calculateStreak(habit.id)
    }));

    return { consumed, burned, water, protein, carbs, fat, dayFood, dayActivity, dayWater, filteredFood, habitCompletion };
  }, [data, selectedDate, foodSearchQuery]);

  useEffect(() => {
    const calorieGoalMet = dailyStats.consumed >= data.profile.dailyCalorieGoal;
    const waterGoalMet = dailyStats.water >= data.profile.dailyWaterGoalMl;

    if (calorieGoalMet && !goalsMetRef.current.calories) {
      confetti({
        particleCount: 250,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
        gravity: 0.8,
        scalar: 1.2
      });
      goalsMetRef.current.calories = true;
    }

    if (waterGoalMet && !goalsMetRef.current.water) {
      confetti({
        particleCount: 250,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
        gravity: 0.8,
        scalar: 1.2
      });
      goalsMetRef.current.water = true;
    }

    // Reset refs if goals are no longer met (e.g., entry deleted or date changed)
    if (!calorieGoalMet) goalsMetRef.current.calories = false;
    if (!waterGoalMet) goalsMetRef.current.water = false;
  }, [dailyStats.consumed, dailyStats.water, data.profile.dailyCalorieGoal, data.profile.dailyWaterGoalMl]);

  useEffect(() => {
    // Reset goals met tracking when date changes
    goalsMetRef.current = { calories: false, water: false };
  }, [selectedDate]);

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput.trim()) return;

    setIsAnalyzing(true);
    try {
      const parsedQuantity = parseFloat(foodQuantity) || 1;
      const result = await analyzeFood(foodInput, parsedQuantity, foodUnit);
      const newEntry: FoodEntry = {
        id: crypto.randomUUID(),
        ...result,
        quantity: parsedQuantity,
        unit: foodUnit,
        timestamp: selectedDate.getTime(),
        mealType: mealType
      };
      setData(prev => ({
        ...prev,
        foodEntries: [newEntry, ...prev.foodEntries]
      }));
      setFoodInput('');
      setFoodQuantity('1');
      setFoodUnit('serving');
      setIsAddFoodOpen(false);
    } catch (error) {
      console.error('Failed to analyze food:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddWater = (amount: number, caloriesConsumed?: number, caloriesBurned?: number) => {
    const newEntry: WaterEntry = {
      id: crypto.randomUUID(),
      amountMl: amount,
      timestamp: selectedDate.getTime(),
      caloriesConsumed,
      caloriesBurned
    };
    setData(prev => ({
      ...prev,
      waterEntries: [newEntry, ...prev.waterEntries]
    }));
  };

  const handleLogWeight = (weight: number) => {
    const newEntry: WeightEntry = {
      id: crypto.randomUUID(),
      weight,
      timestamp: selectedDate.getTime()
    };
    setData(prev => ({
      ...prev,
      weightEntries: [newEntry, ...prev.weightEntries].sort((a, b) => a.timestamp - b.timestamp),
      profile: { ...prev.profile, currentWeight: weight }
    }));
  };

  const deleteEntry = (type: 'food' | 'activity' | 'water' | 'weight', id: string) => {
    setData(prev => ({
      ...prev,
      [`${type}Entries`]: (prev[`${type}Entries` as keyof HealthData] as any[]).filter((e: any) => e.id !== id)
    }));
  };

  const toggleHabit = (habitId: string) => {
    const existingLogIndex = data.habitLogs.findIndex(
      log => log.habitId === habitId && isSameDay(new Date(log.timestamp), selectedDate)
    );

    if (existingLogIndex >= 0) {
      setData(prev => ({
        ...prev,
        habitLogs: prev.habitLogs.filter((_, i) => i !== existingLogIndex)
      }));
    } else {
      const newLog = {
        id: crypto.randomUUID(),
        habitId,
        timestamp: selectedDate.getTime()
      };
      setData(prev => ({
        ...prev,
        habitLogs: [...prev.habitLogs, newLog]
      }));
    }
  };

  const macroData = useMemo(() => {
    const totalCals = (dailyStats.protein * 4) + (dailyStats.carbs * 4) + (dailyStats.fat * 9);
    const pPercent = totalCals > 0 ? Math.round((dailyStats.protein * 4 / totalCals) * 100) : 0;
    const cPercent = totalCals > 0 ? Math.round((dailyStats.carbs * 4 / totalCals) * 100) : 0;
    const fPercent = totalCals > 0 ? Math.max(0, 100 - pPercent - cPercent) : 0;

    return [
      { name: 'Protein', value: dailyStats.protein, percent: pPercent, color: '#3b82f6' }, // Blue
      { name: 'Carbs', value: dailyStats.carbs, percent: cPercent, color: '#f59e0b' }, // Orange
      { name: 'Fat', value: dailyStats.fat, percent: fPercent, color: '#ef4444' } // Red
    ];
  }, [dailyStats.protein, dailyStats.carbs, dailyStats.fat]);

  const historyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayFood = (data.foodEntries || []).filter(e => isSameDay(new Date(e.timestamp), date));
      const calories = dayFood.reduce((acc, curr) => acc + (curr.calories || 0), 0);
      return {
        date: format(date, 'MMM d'),
        calories,
        goal: data.profile?.dailyCalorieGoal || 2000
      };
    }).reverse();
    return days;
  }, [data]);

  const weightHistoryData = useMemo(() => {
    const sortedEntries = [...(data.weightEntries || [])].sort((a, b) => a.timestamp - b.timestamp);
    
    if (sortedEntries.length === 0) {
      return [{
        date: format(new Date(), 'MMM d'),
        weight: data.profile?.currentWeight || 70,
        goal: data.profile?.weightGoal || 70
      }];
    }

    return sortedEntries.map(entry => ({
      date: format(new Date(entry.timestamp), 'MMM d'),
      weight: entry.weight,
      goal: data.profile?.weightGoal || 70
    }));
  }, [data.weightEntries, data.profile?.currentWeight, data.profile?.weightGoal]);

  const combinedHistory = useMemo(() => {
    const food = (data.foodEntries || []).map(e => ({ ...e, type: 'food' as const }));
    const activity = (data.activityEntries || []).map(e => ({ ...e, type: 'activity' as const }));
    const water = (data.waterEntries || []).map(e => ({ ...e, type: 'water' as const }));
    const weight = (data.weightEntries || []).map(e => ({ ...e, type: 'weight' as const }));
    const habits = (data.habitLogs || []).map(e => {
      const habit = (data.habits || []).find(h => h.id === e.habitId);
      return {
        ...e,
        type: 'habit' as const,
        name: habit?.name || 'Unknown Habit',
        icon: habit?.icon || 'Sparkles'
      };
    });

    return [...food, ...activity, ...water, ...weight, ...habits]
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [data]);

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="wallpaper-bg" />
      {/* Header */}
      <header className="sticky top-0 z-30 surface-bg/70 backdrop-blur-xl border-b border-white/40 dark:border-slate-800/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-card-pink rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <TrendingUp size={24} />
            </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-600 to-rose-600 bg-clip-text text-transparent">CalBuddy</h1>
                <p className="text-[10px] text-[#5a6b8b] font-bold uppercase tracking-widest">
                  {activeTab === 'today' ? format(selectedDate, 'EEEE, MMMM do') : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </p>
              </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-[#8b7e66] hover:text-[#1a2b4b] dark:hover:text-slate-200 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className="p-2 text-[#8b7e66] hover:text-[#1a2b4b] dark:hover:text-slate-200 transition-colors"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'today' && (
          <>
            {/* Calorie Progress */}
            <section className={cn(
              "glass-card p-6 transition-all duration-500 relative overflow-hidden",
              dailyStats.consumed > data.profile.dailyCalorieGoal ? "ring-2 ring-red-500/20 border-red-100 dark:border-red-900/30" : 
              dailyStats.consumed >= data.profile.dailyCalorieGoal ? "ring-2 ring-emerald-500/20 border-emerald-100 dark:border-emerald-900/30" : ""
            )} style={{ '--card-bg': 'var(--card-bg-summary)', '--card-border': 'var(--card-border-summary)' } as React.CSSProperties}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full -ml-16 -mb-16 blur-3xl" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="stat-label">Daily Calories</p>
                    {dailyStats.consumed >= data.profile.dailyCalorieGoal && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          dailyStats.consumed > data.profile.dailyCalorieGoal 
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {dailyStats.consumed > data.profile.dailyCalorieGoal ? 'Goal Exceeded' : 'Goal Met!'}
                      </motion.div>
                    )}
                  </div>
                  <h2 className="stat-value text-3xl"><AnimatedNumber value={dailyStats.consumed} /> <span className="text-[#8b7e66] font-normal text-lg">/ {data.profile.dailyCalorieGoal} kcal</span></h2>
                </div>
                <div className="text-right">
                  <p className="stat-label">{data.profile.dailyCalorieGoal - dailyStats.consumed < 0 ? "Over" : "Remaining"}</p>
                  <p className={cn(
                    "text-xl font-bold",
                    data.profile.dailyCalorieGoal - dailyStats.consumed < 0 ? "text-red-500" : "text-brand-600 dark:text-brand-500"
                  )}>
                    <AnimatedNumber value={Math.abs(data.profile.dailyCalorieGoal - dailyStats.consumed)} />
                  </p>
                </div>
              </div>
              
              <div className="h-3 bg-[#e5e1c9] dark:bg-slate-800 rounded-full overflow-hidden mb-6 relative z-10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((dailyStats.consumed / data.profile.dailyCalorieGoal) * 100, 100)}%` }}
                  className={cn(
                    "h-full transition-all duration-1000",
                    dailyStats.consumed > data.profile.dailyCalorieGoal ? "bg-red-500" : "bg-gradient-to-r from-brand-500 to-rose-500"
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 relative z-10">
                {macroData.map(macro => (
                  <div key={macro.name}>
                    <p className="text-[10px] font-bold text-[#8b7e66] uppercase mb-1">{macro.name}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-sm font-bold dark:text-white">
                        {data.profile.macroUnit === 'g' ? <><AnimatedNumber value={macro.value} />g</> : <><AnimatedNumber value={macro.percent} />%</>}
                      </span>
                    </div>
                    <div className="h-1 bg-[#f5f2ed] dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.profile.macroUnit === 'g' ? Math.min(macro.value, 100) : macro.percent}%` }}
                        className="h-full rounded-full" 
                        style={{ 
                          backgroundColor: macro.color 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Water Tracker */}
            <section className="glass-card p-6 relative overflow-hidden group" style={{ '--card-bg': 'var(--card-bg-water)', '--card-border': 'var(--card-border-water)' } as React.CSSProperties}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500">
                    <Droplets size={18} />
                  </div>
                  <h3 className="font-bold dark:text-white text-[#1a2b4b]">Water Intake</h3>
                  {dailyStats.water >= data.profile.dailyWaterGoalMl && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    >
                      Goal Met!
                    </motion.div>
                  )}
                </div>
                <span className="text-sm font-bold text-[#5a6b8b] dark:text-slate-400"><AnimatedNumber value={dailyStats.water} /> <span className="text-[#8b7e66] font-normal">/ {data.profile.dailyWaterGoalMl} ml</span></span>
              </div>
              
              <div className="w-full h-2 bg-[#f5f2ed] dark:bg-slate-800 rounded-full overflow-hidden mb-6 relative z-10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (dailyStats.water / data.profile.dailyWaterGoalMl) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 relative z-10">
                {[250, 500].map(amount => (
                  <div key={amount} className="flex gap-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddWater(amount)}
                      className="flex-1 py-2 px-3 rounded-xl border border-[#dcd7ba] dark:border-blue-900/30 bg-[#f0f7ff] dark:bg-blue-900/20 text-[#1e40af] dark:text-blue-400 text-sm font-bold hover:bg-[#e0efff] dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> {amount}ml
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddWater(-amount)}
                      className="py-2 px-3 rounded-xl border border-[#e5e1c9] dark:border-slate-800 bg-[#fdfcf0] dark:bg-slate-900/50 text-[#8b7e66] dark:text-slate-500 text-sm font-bold hover:bg-[#f5f2ed] dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                      title={`Remove ${amount}ml`}
                    >
                      <Minus size={14} />
                    </motion.button>
                  </div>
                ))}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAddWaterOpen(true)}
                  className="col-span-2 py-2 px-3 rounded-xl border border-[#e5e1c9] dark:border-slate-800 bg-[#fdfcf0] dark:bg-slate-900/50 text-[#5a6b8b] dark:text-slate-400 text-sm font-bold hover:bg-[#f5f2ed] dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> Custom Water Entry
                </motion.button>
              </div>
            </section>

            {/* Food Log */}
            <section className="space-y-3" style={{ '--card-bg': 'var(--card-bg-food)', '--card-border': 'var(--card-border-food)' } as React.CSSProperties}>
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-[#1a2b4b] dark:text-white">Today's Food</h3>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddFoodOpen(true)}
                  className="px-4 py-2 gradient-card-pink rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Food
                </motion.button>
              </div>

              {dailyStats.dayFood.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7e66] dark:text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search food entries..."
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#fdfcf0] dark:bg-slate-900/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all dark:text-white"
                  />
                  {foodSearchQuery && (
                    <button 
                      onClick={() => setFoodSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7e66] hover:text-[#1a2b4b] dark:hover:text-slate-200"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {dailyStats.dayFood.length === 0 ? (
                  <div className="text-center py-12 bg-[#fdfcf0] dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-[#dcd7ba] dark:border-slate-800">
                    <Utensils className="mx-auto text-[#dcd7ba] dark:text-slate-700 mb-2" size={32} />
                    <p className="text-[#8b7e66] dark:text-slate-500 text-sm">No food logged yet</p>
                  </div>
                ) : dailyStats.filteredFood.length === 0 ? (
                  <div className="text-center py-12 bg-[#fdfcf0] dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-[#dcd7ba] dark:border-slate-800">
                    <Search className="mx-auto text-[#dcd7ba] dark:text-slate-700 mb-2" size={32} />
                    <p className="text-[#8b7e66] dark:text-slate-500 text-sm">No matches found for "{foodSearchQuery}"</p>
                  </div>
                ) : (
                  dailyStats.filteredFood.map(entry => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={entry.id} 
                      className="glass-card p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f5f2ed] dark:bg-slate-800 rounded-lg flex items-center justify-center text-[#5a6b8b] dark:text-slate-400">
                          <Utensils size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm dark:text-white">
                              {entry.quantity && entry.unit ? `${entry.quantity} ${entry.unit} ` : ''}{entry.name}
                            </h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#f5f2ed] dark:bg-slate-800 text-[#8b7e66] dark:text-slate-500 font-bold uppercase tracking-wider">
                              {entry.mealType}
                            </span>
                          </div>
                          <p className="text-xs text-[#5a6b8b] dark:text-slate-400">
                            {data.profile.macroUnit === 'g' ? (
                              `P: ${entry.protein}g • C: ${entry.carbs}g • F: ${entry.fat}g`
                            ) : (() => {
                              const total = (entry.protein * 4) + (entry.carbs * 4) + (entry.fat * 9);
                              if (total === 0) return `P: 0% • C: 0% • F: 0%`;
                              const p = Math.round((entry.protein * 4 / total) * 100);
                              const c = Math.round((entry.carbs * 4 / total) * 100);
                              const f = Math.max(0, 100 - p - c);
                              return `P: ${p}% • C: ${c}% • F: ${f}%`;
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm dark:text-white">{entry.calories} kcal</span>
                        <button 
                          onClick={() => deleteEntry('food', entry.id)}
                          className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            {/* Activity Log */}
            <section className="space-y-3" style={{ '--card-bg': 'var(--card-bg-activity)', '--card-border': 'var(--card-border-activity)' } as React.CSSProperties}>
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-[#1a2b4b] dark:text-white">Today's Activity</h3>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddActivityOpen(true)}
                  className="px-4 py-2 gradient-card-orange rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Log Activity
                </motion.button>
              </div>

              <div className="space-y-3">
                {dailyStats.dayActivity.length === 0 ? (
                  <div className="text-center py-12 bg-[#fdfcf0] dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-[#dcd7ba] dark:border-slate-800">
                    <Flame className="mx-auto text-[#dcd7ba] dark:text-slate-700 mb-2" size={32} />
                    <p className="text-[#8b7e66] dark:text-slate-500 text-sm">No activities logged yet</p>
                  </div>
                ) : (
                  dailyStats.dayActivity.map(entry => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={entry.id} 
                      className="glass-card p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-500 dark:text-orange-400">
                          <Flame size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm dark:text-white">{entry.name}</h4>
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider",
                              entry.intensity === 'High' ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                              entry.intensity === 'Medium' ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
                              "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            )}>
                              {entry.intensity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{entry.durationMinutes} mins</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-orange-600 dark:text-orange-400">-{entry.caloriesBurned} kcal</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingActivity(entry);
                              setActivityInput({
                                name: entry.name,
                                calories: entry.caloriesBurned.toString(),
                                duration: entry.durationMinutes.toString(),
                                intensity: entry.intensity
                              });
                              setIsAddActivityOpen(true);
                            }}
                            className="text-[#8b7e66] hover:text-blue-500 transition-colors"
                          >
                            <SettingsIcon size={16} />
                          </button>
                          <button 
                            onClick={() => deleteEntry('activity', entry.id)}
                            className="text-[#8b7e66] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            {/* Water Log */}
            {dailyStats.dayWater.length > 0 && (
              <section className="space-y-3" style={{ '--card-bg': 'var(--card-bg-water)', '--card-border': 'var(--card-border-water)' } as React.CSSProperties}>
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-[#1a2b4b] dark:text-white">Water Log</h3>
                </div>
                <div className="space-y-3">
                  {dailyStats.dayWater.map(entry => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={entry.id} 
                      className="glass-card p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500 dark:text-blue-400">
                          <Droplets size={18} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm dark:text-white">{entry.amountMl} ml</h4>
                          {(entry.caloriesConsumed || entry.caloriesBurned) ? (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {entry.caloriesConsumed ? `+${entry.caloriesConsumed} kcal ` : ''}
                              {entry.caloriesBurned ? `-${entry.caloriesBurned} kcal` : ''}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{format(new Date(entry.timestamp), 'h:mm a')}</p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteEntry('water', entry.id)}
                        className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

          </>
        )}

        {activeTab === 'history' && (
          <section className="space-y-6" style={{ '--card-bg': 'var(--card-bg-summary)', '--card-border': 'var(--card-border-summary)' } as React.CSSProperties}>
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4 dark:text-white">Last 7 Days</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip 
                      cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        color: isDarkMode ? '#ffffff' : '#000000'
                      }}
                      itemStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                    />
                    <Bar dataKey="calories" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold px-1 dark:text-white">Recent History</h3>
              {combinedHistory.slice(0, 20).map(entry => (
                <div key={entry.id} className="glass-card p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      entry.type === 'food' ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" :
                      entry.type === 'activity' ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400" :
                      entry.type === 'water' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400" :
                      entry.type === 'weight' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400" :
                      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400"
                    )}>
                      {entry.type === 'food' && <Utensils size={18} />}
                      {entry.type === 'activity' && <Flame size={18} />}
                      {entry.type === 'water' && <Droplets size={18} />}
                      {entry.type === 'weight' && <Scale size={18} />}
                      {entry.type === 'habit' && <HabitIcon name={(entry as any).icon} size={18} />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm dark:text-white">
                        {entry.type === 'food' && (entry as any).quantity && (entry as any).unit 
                          ? `${(entry as any).quantity} ${(entry as any).unit} ` 
                          : ''}
                        {(entry as any).name || (entry as any).amountMl + ' ml' || (entry as any).weight + ' ' + data.profile.weightUnit}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{format(new Date(entry.timestamp), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-sm dark:text-white">
                      {entry.type === 'food' && `${(entry as any).calories} kcal`}
                      {entry.type === 'activity' && `-${(entry as any).caloriesBurned} kcal`}
                      {entry.type === 'water' && `${(entry as any).amountMl} ml`}
                      {entry.type === 'weight' && `${(entry as any).weight} ${data.profile.weightUnit}`}
                      {entry.type === 'habit' && 'Completed'}
                    </span>
                    <button 
                      onClick={() => {
                        if (entry.type === 'habit') {
                          setData(prev => ({
                            ...prev,
                            habitLogs: prev.habitLogs.filter(log => log.id !== entry.id)
                          }));
                        } else {
                          deleteEntry(entry.type, entry.id);
                        }
                      }}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'habits' && (
          <section className="space-y-6" style={{ '--card-bg': 'var(--card-bg-habits)', '--card-border': 'var(--card-border-habits)' } as React.CSSProperties}>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Daily Habits</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Track your consistency</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-brand-600 dark:text-brand-500">
                    <AnimatedNumber value={dailyStats.habitCompletion.filter(h => h.completed).length} />/<AnimatedNumber value={dailyStats.habitCompletion.length} />
                  </div>
                  <div className="text-[10px] font-bold text-[#8b7e66] uppercase tracking-widest">Completed</div>
                </div>
              </div>

              <div className="space-y-3">
                {dailyStats.habitCompletion.map(habit => (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={cn(
                      "w-full glass-card p-4 flex items-center justify-between group transition-all duration-300",
                      habit.completed ? "bg-white/90 dark:bg-slate-900/40" : ""
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                          habit.completed ? "scale-95" : "bg-white dark:bg-slate-800"
                        )}
                        style={habit.completed ? { backgroundColor: `${habit.color}20`, color: habit.color } : { color: habit.color }}
                      >
                        <HabitIcon name={habit.icon} size={24} />
                      </div>
                      <div className="text-left">
                        <h4 className={cn(
                          "font-bold text-sm transition-colors",
                          habit.completed ? "text-[#8b7e66] dark:text-slate-500 line-through" : "text-[#1a2b4b] dark:text-white"
                        )}>
                          {habit.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Flame size={12} className={habit.streak > 0 ? "text-orange-500" : "text-[#dcd7ba]"} />
                          <span className="text-[10px] font-bold text-[#8b7e66] uppercase tracking-wider">
                            {habit.streak} day streak
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                      habit.completed 
                        ? "bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20" 
                        : "border-[#e5e1c9] dark:border-slate-700"
                    )}>
                      {habit.completed && <CheckCircle2 size={18} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold dark:text-white">Manage Your Habits</h4>
                <button 
                  onClick={() => setIsAddHabitOpen(true)}
                  className="text-brand-600 dark:text-brand-500 text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={16} /> Add New
                </button>
              </div>
              <p className="text-xs text-[#5a6b8b] dark:text-slate-400 mb-4">Create habits you want to track daily. You can also manage them in your profile settings.</p>
            </div>
          </section>
        )}

        {activeTab === 'activity' && (
          <section className="space-y-6" style={{ '--card-bg': 'var(--card-bg-activity)', '--card-border': 'var(--card-border-activity)' } as React.CSSProperties}>
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">Activity Tracking</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Log your workouts to see your net calorie balance.</p>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAddActivityOpen(true)}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
              >
                Log Workout
              </motion.button>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold px-1 dark:text-white">Today's Activity</h3>
              {dailyStats.dayActivity.length === 0 ? (
                <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No activities logged today</p>
              ) : (
                dailyStats.dayActivity.map(activity => (
                  <div key={activity.id} className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-500 dark:text-orange-400">
                        <Flame size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm dark:text-white">{activity.name}</h4>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider",
                            activity.intensity === 'High' ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                            activity.intensity === 'Medium' ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
                            "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          )}>
                            {activity.intensity}
                          </span>
                        </div>
                        <p className="text-xs text-[#5a6b8b] dark:text-slate-400">{activity.durationMinutes} mins</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-orange-600 dark:text-orange-400">-{activity.caloriesBurned} kcal</span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'weight' && (
          <section className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Weight Progress</h3>
                  <p className="text-sm text-[#5a6b8b] dark:text-slate-400">Track your journey to {data.profile.weightGoal}{data.profile.weightUnit}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-brand-600 dark:text-brand-500"><AnimatedNumber value={data.profile.currentWeight} /></div>
                  <div className="text-[10px] font-bold text-[#8b7e66] uppercase tracking-widest">{data.profile.weightUnit}</div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: isDarkMode ? '#64748b' : '#8b7e66', fontSize: 10, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      hide 
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        color: isDarkMode ? '#f8fafc' : '#1e293b'
                      }}
                      itemStyle={{ fontWeight: 700 }}
                    />
                    <ReferenceLine y={data.profile.weightGoal} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'Goal', fill: '#10b981', fontSize: 10, fontWeight: 700 }} />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4, stroke: isDarkMode ? '#0f172a' : '#ffffff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6">
              <h4 className="font-bold mb-4 dark:text-white">Log New Weight</h4>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const weight = parseFloat((form.elements.namedItem('weight') as HTMLInputElement).value);
                  if (weight) {
                    handleLogWeight(weight);
                    form.reset();
                  }
                }}
                className="flex gap-3"
              >
                <input 
                  name="weight"
                  type="number" 
                  step="0.1"
                  required
                  placeholder={`Weight in ${data.profile.weightUnit}`}
                  className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
                >
                  Log
                </motion.button>
              </form>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold px-1 dark:text-white">Recent Entries</h4>
              {[...data.weightEntries].reverse().slice(0, 5).map(entry => (
                <div key={entry.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                      <Scale size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm dark:text-white">{entry.weight} {data.profile.weightUnit}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(entry.timestamp), 'MMMM do, yyyy')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteEntry('weight', entry.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="space-y-6">
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 text-2xl font-bold">
                {data.profile.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{data.profile.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Weight Goal: {data.profile.weightGoal}{data.profile.weightUnit}</p>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h4 className="font-bold dark:text-white">Units</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 block">Weight Unit</label>
                  <div className="flex gap-2">
                    {(['kg', 'lbs'] as const).map((unit) => (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={unit}
                        onClick={() => setData(prev => ({ ...prev, profile: { ...prev.profile, weightUnit: unit } }))}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                          data.profile.weightUnit === unit
                            ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20"
                            : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        {unit.toUpperCase()}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 block">Macronutrient Display</label>
                  <div className="flex gap-2">
                    {(['g', '%'] as const).map((unit) => (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={unit}
                        onClick={() => setData(prev => ({ ...prev, profile: { ...prev.profile, macroUnit: unit } }))}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                          data.profile.macroUnit === unit
                            ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20"
                            : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        {unit === 'g' ? 'Grams (g)' : 'Percentage (%)'}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold dark:text-white">Manage Habits</h4>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddHabitOpen(true)}
                  className="text-brand-600 dark:text-brand-500 text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={16} /> Add Habit
                </motion.button>
              </div>
              <div className="space-y-2">
                {data.habits.length === 0 ? (
                  <p className="text-center py-4 text-[#8b7e66] text-xs italic">No habits added yet</p>
                ) : (
                  data.habits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-[#fdfcf0] dark:bg-slate-800/50 rounded-xl border border-[#e5e1c9] dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f5f2ed] dark:bg-slate-800 flex items-center justify-center text-[#5a6b8b] dark:text-slate-400">
                          <HabitIcon name={habit.icon} size={16} />
                        </div>
                        <span className="text-sm font-medium dark:text-white">{habit.name}</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm(`Delete habit "${habit.name}"?`)) {
                            setData(prev => ({
                              ...prev,
                              habits: prev.habits.filter(h => h.id !== habit.id),
                              habitLogs: prev.habitLogs.filter(l => l.habitId !== habit.id)
                            }));
                          }
                        }}
                        className="text-[#dcd7ba] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h4 className="font-bold dark:text-white">Goals & Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Daily Calorie Goal</label>
                  <input 
                    type="number" 
                    value={data.profile.dailyCalorieGoal}
                    onChange={(e) => setData(prev => ({ ...prev, profile: { ...prev.profile, dailyCalorieGoal: parseInt(e.target.value) || 0 } }))}
                    className="w-full mt-1 p-3 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Daily Water Goal (ml)</label>
                  <input 
                    type="number" 
                    value={data.profile.dailyWaterGoalMl}
                    onChange={(e) => setData(prev => ({ ...prev, profile: { ...prev.profile, dailyWaterGoalMl: parseInt(e.target.value) || 0 } }))}
                    className="w-full mt-1 p-3 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Current Weight ({data.profile.weightUnit})</label>
                  <input 
                    type="number" 
                    value={data.profile.currentWeight}
                    onChange={(e) => setData(prev => ({ ...prev, profile: { ...prev.profile, currentWeight: parseFloat(e.target.value) || 0 } }))}
                    className="w-full mt-1 p-3 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Weight Goal ({data.profile.weightUnit})</label>
                  <input 
                    type="number" 
                    value={data.profile.weightGoal}
                    onChange={(e) => setData(prev => ({ ...prev, profile: { ...prev.profile, weightGoal: parseFloat(e.target.value) || 0 } }))}
                    className="w-full mt-1 p-3 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Theme Color</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input 
                      type="color" 
                      value={data.profile.primaryColor || '#ec4899'}
                      onChange={(e) => setData(prev => ({ ...prev, profile: { ...prev.profile, primaryColor: e.target.value } }))}
                      className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                    />
                    <div className="flex-1 flex gap-2">
                      {['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'].map(color => (
                        <button
                          key={color}
                          onClick={() => setData(prev => ({ ...prev, profile: { ...prev.profile, primaryColor: color } }))}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                            data.profile.primaryColor === color ? "border-[#1a2b4b] scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Card Background Color (Light)</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input 
                      type="color" 
                      value={data.profile.cardColor || '#ffffff'}
                      onChange={(e) => setData(prev => ({ ...prev, profile: { ...prev.profile, cardColor: e.target.value } }))}
                      className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                    />
                    <div className="flex-1 flex flex-wrap gap-2">
                      {['#ffffff', '#f8fafc', '#f1f5f9', '#fef2f2', '#f0f9ff', '#f0fdf4', '#0f172a', '#1e293b', '#171717'].map(color => (
                        <button
                          key={color}
                          onClick={() => setData(prev => ({ ...prev, profile: { ...prev.profile, cardColor: color } }))}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                            data.profile.cardColor === color ? "border-[#1a2b4b] scale-110" : "border-slate-200"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Card Background Color (Dark)</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input 
                      type="color" 
                      value={data.profile.darkCardColor || '#0f172a'}
                      onChange={(e) => setData(prev => ({ ...prev, profile: { ...prev.profile, darkCardColor: e.target.value } }))}
                      className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                    />
                    <div className="flex-1 flex flex-wrap gap-2">
                      {['#0f172a', '#1e293b', '#334155', '#171717', '#262626', '#1c1917'].map(color => (
                        <button
                          key={color}
                          onClick={() => setData(prev => ({ ...prev, profile: { ...prev.profile, darkCardColor: color } }))}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                            data.profile.darkCardColor === color ? "border-white scale-110" : "border-slate-700"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Individual Box Colors (Light)</label>
                  <p className="text-[10px] text-slate-500 mb-2">Customize the color of each specific section in light mode.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['summary', 'water', 'food', 'activity', 'habits', 'weight'].map(box => (
                      <div key={box} className="flex items-center justify-between p-2 rounded-xl bg-[#fdfcf0] dark:bg-slate-900/50 border border-[#e5e1c9] dark:border-slate-800">
                        <span className="text-xs font-bold capitalize text-[#1a2b4b] dark:text-slate-300">{box}</span>
                        <input 
                          type="color" 
                          value={data.profile.boxColors?.[box as keyof BoxColors] || data.profile.cardColor || '#ffffff'}
                          onChange={(e) => setData(prev => ({ 
                            ...prev, 
                            profile: { 
                              ...prev.profile, 
                              boxColors: { ...prev.profile.boxColors, [box]: e.target.value } 
                            } 
                          }))}
                          className="w-8 h-8 rounded-lg border-none cursor-pointer bg-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Individual Box Colors (Dark)</label>
                  <p className="text-[10px] text-slate-500 mb-2">Customize the color of each specific section in dark mode.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['summary', 'water', 'food', 'activity', 'habits', 'weight'].map(box => (
                      <div key={box} className="flex items-center justify-between p-2 rounded-xl bg-[#fdfcf0] dark:bg-slate-900/50 border border-[#e5e1c9] dark:border-slate-800">
                        <span className="text-xs font-bold capitalize text-[#1a2b4b] dark:text-slate-300">{box}</span>
                        <input 
                          type="color" 
                          value={data.profile.darkBoxColors?.[box as keyof BoxColors] || data.profile.darkCardColor || '#0f172a'}
                          onChange={(e) => setData(prev => ({ 
                            ...prev, 
                            profile: { 
                              ...prev.profile, 
                              darkBoxColors: { ...prev.profile.darkBoxColors, [box]: e.target.value } 
                            } 
                          }))}
                          className="w-8 h-8 rounded-lg border-none cursor-pointer bg-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Custom Wallpaper</label>
                  <div className="mt-2 space-y-4">
                    {data.profile.wallpaperUrl ? (
                      <>
                        <div className="relative group rounded-2xl overflow-hidden aspect-video border border-[#dcd7ba] dark:border-slate-800">
                          <img 
                            src={data.profile.wallpaperUrl} 
                            alt="Custom Wallpaper" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <label className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white cursor-pointer hover:bg-white/30 transition-colors">
                              <Camera size={20} />
                              <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
                            </label>
                            <button 
                              onClick={removeWallpaper}
                              className="p-2 bg-red-500/40 backdrop-blur-md rounded-full text-white hover:bg-red-500/60 transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-3 p-4 bg-[#fdfcf0] dark:bg-slate-900/50 rounded-2xl border border-[#dcd7ba] dark:border-slate-800">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-[#8b7e66] dark:text-slate-500 uppercase tracking-wider">Opacity</label>
                              <span className="text-[10px] font-mono font-bold text-brand-600">{Math.round((data.profile.wallpaperOpacity || 1) * 100)}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="1" 
                              step="0.05"
                              value={data.profile.wallpaperOpacity || 1}
                              onChange={(e) => setData(prev => ({ ...prev, profile: { ...prev.profile, wallpaperOpacity: parseFloat(e.target.value) } }))}
                              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-[#8b7e66] dark:text-slate-500 uppercase tracking-wider">Blur</label>
                              <span className="text-[10px] font-mono font-bold text-brand-600">{data.profile.wallpaperBlur || 0}px</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="20" 
                              step="1"
                              value={data.profile.wallpaperBlur || 0}
                              onChange={(e) => setData(prev => ({ ...prev, profile: { ...prev.profile, wallpaperBlur: parseInt(e.target.value) } }))}
                              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#dcd7ba] dark:border-slate-800 rounded-2xl bg-[#fdfcf0] dark:bg-slate-900/50 cursor-pointer hover:bg-[#f5f2ed] dark:hover:bg-slate-900 transition-all group">
                        <Image className="text-[#dcd7ba] dark:text-slate-700 mb-2 group-hover:scale-110 transition-transform" size={32} />
                        <span className="text-xs font-bold text-[#8b7e66] dark:text-slate-500">Upload Background Image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full py-4 bg-brand-600 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-brand-700 dark:hover:bg-slate-100 transition-all disabled:opacity-70"
              >
                <RefreshCw className={isSyncing ? "animate-spin" : ""} size={20} />
                {isSyncing ? 'Syncing Data...' : 'Sync Health Data'}
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (confirm('Are you sure you want to clear all data?')) {
                    setData({
                      foodEntries: [],
                      activityEntries: [],
                      waterEntries: [],
                      weightEntries: [],
                      habits: [
                        { id: '1', name: 'Morning Meditation', icon: 'Brain', color: '#8b5cf6' },
                        { id: '2', name: 'Read for 30 mins', icon: 'Coffee', color: '#f59e0b' },
                        { id: '3', name: '8 Hours Sleep', icon: 'Moon', color: '#3b82f6' }
                      ],
                      habitLogs: [],
                      profile: INITIAL_PROFILE
                    });
                  }
                }}
                className="w-full py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                Reset All Data
              </motion.button>
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      {activeTab === 'today' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => setIsAddFoodOpen(true)}
            className="w-14 h-14 bg-brand-600 text-white rounded-full shadow-xl shadow-brand-600/40 flex items-center justify-center"
          >
            <Plus size={32} />
          </motion.button>
        </div>
      )}

      {/* Add Activity Modal */}
      <AnimatePresence>
        {isAddActivityOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddActivityOpen(false)}
              className="absolute inset-0 bg-[#1a2b4b]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md surface-bg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold dark:text-white text-[#1a2b4b]">{editingActivity ? 'Edit Activity' : 'Log Activity'}</h2>
                  <button onClick={() => {
                    setIsAddActivityOpen(false);
                    setEditingActivity(null);
                    setActivityInput({ name: '', calories: '', duration: '', intensity: 'Medium' });
                  }} className="p-2 text-[#8b7e66] hover:bg-[#f5f2ed] dark:hover:bg-slate-800 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddActivity} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Activity Name</label>
                    <input
                      type="text"
                      required
                      value={activityInput.name}
                      onChange={(e) => setActivityInput(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Running, Cycling, Yoga"
                      className="w-full mt-1 p-3 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Calories Burned</label>
                      <input
                        type="number"
                        required
                        value={activityInput.calories}
                        onChange={(e) => setActivityInput(prev => ({ ...prev, calories: e.target.value }))}
                        placeholder="kcal"
                        className="w-full mt-1 p-3 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Duration (mins)</label>
                      <input
                        type="number"
                        value={activityInput.duration}
                        onChange={(e) => setActivityInput(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="30"
                        className="w-full mt-1 p-3 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase">Intensity</label>
                    <div className="flex gap-2 mt-1">
                      {(['Low', 'Medium', 'High'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setActivityInput(prev => ({ ...prev, intensity: level }))}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                            activityInput.intensity === level
                              ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                              : "bg-[#fdfcf0] dark:bg-slate-800/50 text-[#8b7e66] dark:text-slate-500 border-[#dcd7ba] dark:border-slate-800 hover:border-[#8b7e66] dark:hover:border-slate-700"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-4 gradient-card-orange text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
                  >
                    {editingActivity ? <CheckCircle2 size={20} /> : <Flame size={20} />}
                    {editingActivity ? 'Update Activity' : 'Log Activity'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isAddFoodOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddFoodOpen(false)}
              className="absolute inset-0 bg-[#1a2b4b]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md surface-bg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold dark:text-white">Add Food</h2>
                  <button onClick={() => setIsAddFoodOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddFood} className="space-y-4">
                  <div className="flex gap-2">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMealType(type)}
                        className={cn(
                          "flex-1 py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                          mealType === type 
                            ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20" 
                            : "bg-[#fdfcf0] dark:bg-slate-800/50 text-[#8b7e66] dark:text-slate-500 border-[#dcd7ba] dark:border-slate-800 hover:border-[#8b7e66] dark:hover:border-slate-700"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <textarea
                      value={foodInput}
                      onChange={(e) => setFoodInput(e.target.value)}
                      placeholder="Describe what you ate (e.g., 'eggs and a piece of toast')"
                      className="w-full h-32 p-4 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none text-sm dark:text-white"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-600 shadow-sm disabled:opacity-50"
                        title="Upload Image"
                      >
                        <Image size={20} />
                      </button>
                      <button 
                        type="button" 
                        onClick={startCamera}
                        disabled={isAnalyzing}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-600 shadow-sm disabled:opacity-50"
                        title="Live Scan"
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase mb-1">Quantity</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={foodQuantity}
                        onChange={(e) => setFoodQuantity(e.target.value)}
                        className="w-full p-3 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm dark:text-white"
                        placeholder="1"
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-xs font-bold text-[#8b7e66] dark:text-slate-500 uppercase mb-1">Unit</label>
                      <select
                        value={foodUnit}
                        onChange={(e) => setFoodUnit(e.target.value)}
                        className="w-full p-3 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm dark:text-white appearance-none"
                      >
                        <option value="serving">Serving(s)</option>
                        <option value="grams">Grams (g)</option>
                        <option value="oz">Ounces (oz)</option>
                        <option value="cups">Cup(s)</option>
                        <option value="tbsp">Tablespoon(s)</option>
                        <option value="tsp">Teaspoon(s)</option>
                        <option value="pieces">Piece(s)</option>
                        <option value="slices">Slice(s)</option>
                        <option value="ml">Milliliters (ml)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <button type="button" onClick={() => setFoodInput(prev => prev + (prev ? ', ' : '') + '1 scoop whey protein')} className="text-[10px] px-3 py-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold rounded-full hover:bg-brand-200 dark:hover:bg-brand-900/50 transition-colors">
                      + 1 scoop whey protein
                    </button>
                    <button type="button" onClick={() => setFoodInput(prev => prev + (prev ? ', ' : '') + '1 tbsp peanut butter')} className="text-[10px] px-3 py-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold rounded-full hover:bg-brand-200 dark:hover:bg-brand-900/50 transition-colors">
                      + 1 tbsp peanut butter
                    </button>
                    <button type="button" onClick={() => setFoodInput(prev => prev + (prev ? ', ' : '') + '1 scoop creatine')} className="text-[10px] px-3 py-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold rounded-full hover:bg-brand-200 dark:hover:bg-brand-900/50 transition-colors">
                      + 1 scoop creatine
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isAnalyzing || !foodInput.trim()}
                    className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Search size={20} />
                        Analyze & Log
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 pt-6 border-t border-[#f5f2ed] dark:border-slate-800">
                  <p className="text-xs text-[#8b7e66] dark:text-slate-500 font-medium uppercase tracking-wider mb-3">Recent Items</p>
                  <div className="flex flex-wrap gap-2">
                    {['Apple', 'Chicken Breast', 'Coffee', 'Oatmeal'].map(item => (
                      <button 
                        key={item}
                        onClick={() => setFoodInput(item)}
                        className="px-3 py-1.5 bg-[#fdfcf0] dark:bg-slate-800/50 border border-[#dcd7ba] dark:border-slate-800 rounded-full text-xs font-medium text-[#5a6b8b] dark:text-slate-400 hover:border-brand-500 hover:text-brand-600 transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isAddWaterOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddWaterOpen(false)}
              className="absolute inset-0 bg-[#1a2b4b]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md surface-bg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold dark:text-white">Custom Water Entry</h2>
                  <button onClick={() => setIsAddWaterOpen(false)} className="p-2 text-[#8b7e66] hover:bg-[#f5f2ed] dark:hover:bg-slate-800 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddWater(
                      parseInt(waterInput.amount) || 0,
                      parseInt(waterInput.caloriesConsumed) || undefined,
                      parseInt(waterInput.caloriesBurned) || undefined
                    );
                    setWaterInput({ amount: '', caloriesConsumed: '', caloriesBurned: '' });
                    setIsAddWaterOpen(false);
                  }} 
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Amount (ml)</label>
                    <input
                      type="number"
                      required
                      value={waterInput.amount}
                      onChange={(e) => setWaterInput(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="e.g., 250"
                      className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Calories Consumed</label>
                      <input
                        type="number"
                        value={waterInput.caloriesConsumed}
                        onChange={(e) => setWaterInput(prev => ({ ...prev, caloriesConsumed: e.target.value }))}
                        placeholder="Optional"
                        className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Calories Burned</label>
                      <input
                        type="number"
                        value={waterInput.caloriesBurned}
                        onChange={(e) => setWaterInput(prev => ({ ...prev, caloriesBurned: e.target.value }))}
                        placeholder="Optional"
                        className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!waterInput.amount) return;
                        handleAddWater(
                          -(parseInt(waterInput.amount) || 0),
                          parseInt(waterInput.caloriesConsumed) || undefined,
                          parseInt(waterInput.caloriesBurned) || undefined
                        );
                        setWaterInput({ amount: '', caloriesConsumed: '', caloriesBurned: '' });
                        setIsAddWaterOpen(false);
                      }}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Minus size={20} />
                      Remove
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus size={20} />
                      Add Water
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {isAddHabitOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddHabitOpen(false)}
              className="absolute inset-0 bg-[#1a2b4b]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md surface-bg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold dark:text-white">New Habit</h2>
                  <button onClick={() => setIsAddHabitOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddHabit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Habit Name</label>
                    <input
                      type="text"
                      required
                      value={habitInput.name}
                      onChange={(e) => setHabitInput(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Morning Yoga, Read 10 pages"
                      className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-[#64748b] dark:text-slate-500 uppercase tracking-widest">Icon</label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {['Brain', 'Coffee', 'Moon', 'Sun', 'Heart', 'Dumbbell', 'Sparkles', 'Utensils', 'Droplets', 'Flame', 'Scale', 'TrendingUp', 'CheckCircle2', 'Circle', 'PlusCircle'].map((iconName) => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setHabitInput(prev => ({ ...prev, icon: iconName }))}
                          className={cn(
                            "p-3 rounded-xl border transition-all flex items-center justify-center",
                            habitInput.icon === iconName
                              ? "bg-[#1a2b4b] text-white border-[#1a2b4b] shadow-md"
                              : "bg-white dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-[#e5e1c9] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          )}
                        >
                          <HabitIcon name={iconName} size={20} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#64748b] dark:text-slate-500 uppercase tracking-widest">Color</label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {['#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#1a2b4b'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setHabitInput(prev => ({ ...prev, color }))}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            habitInput.color === color ? "scale-125 border-slate-400 dark:border-white" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={20} />
                    Create Habit
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Live Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
              <button 
                onClick={stopCamera}
                className="p-3 bg-black/50 backdrop-blur-md text-white rounded-full"
              >
                <X size={24} />
              </button>
              <div className="px-4 py-2 bg-black/50 backdrop-blur-md text-white rounded-full text-sm font-bold">
                Live Food Scan
              </div>
              <div className="w-12" />
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-8">
              <button 
                onClick={captureImage}
                className="w-20 h-20 bg-white rounded-full border-8 border-white/30 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 bg-white rounded-full border-2 border-[#dcd7ba]" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm"
          >
            <div className={cn(
              "p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border",
              toast.type === 'success' 
                ? "bg-emerald-500/90 border-emerald-400 text-white" 
                : "bg-red-500/90 border-red-400 text-white"
            )}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                {toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
              </div>
              <p className="font-bold text-sm tracking-tight">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 surface-bg/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('today')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'today' ? "text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <TrendingUp size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Today</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'history' ? "text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <History size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('habits')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'habits' ? "text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <CheckCircle2 size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Habits</span>
          </motion.button>
          <div className="w-12" /> {/* Spacer for FAB */}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('activity')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'activity' ? "text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Flame size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Activity</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('weight')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'weight' ? "text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Scale size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Weight</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'profile' ? "text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <SettingsIcon size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
          </motion.button>
        </div>
      </nav>
    </div>
  );
}
