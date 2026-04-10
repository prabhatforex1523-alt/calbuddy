import {
  Brain,
  CheckCircle2,
  Circle,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Heart,
  Moon as MoonIcon,
  PlusCircle,
  Scale,
  Sparkles,
  Sun as SunIcon,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

const hexToRgb = (hex: string, fallback: [number, number, number] = [113, 113, 122]) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] as [number, number, number]
    : fallback;
};

const toNeutralRgb = (hex: string, fallback: [number, number, number] = [113, 113, 122]) => {
  const [r, g, b] = hexToRgb(hex, fallback);
  const luminance = Math.round((0.299 * r) + (0.587 * g) + (0.114 * b));
  const gray = Math.max(48, Math.min(210, luminance));
  return [gray, gray, gray] as [number, number, number];
};

const toNeutralHex = (hex: string, fallback = '#71717a') => {
  const fallbackRgb = hexToRgb(fallback, [113, 113, 122]);
  const [gray] = toNeutralRgb(hex, fallbackRgb);
  const channel = gray.toString(16).padStart(2, '0');
  return `#${channel}${channel}${channel}`;
};

const HABIT_ICONS: Record<string, LucideIcon> = {
  Brain,
  CheckCircle2,
  Circle,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Heart,
  Moon: MoonIcon,
  PlusCircle,
  Scale,
  Sparkles,
  Sun: SunIcon,
  TrendingUp,
  Utensils,
};

type HabitIconProps = {
  className?: string;
  color?: string;
  name: string;
  size?: number;
};

export function HabitIcon({ name, size = 20, className = '', color }: HabitIconProps) {
  const Icon = HABIT_ICONS[name] || Sparkles;
  return <Icon size={size} className={className} style={color ? { color: toNeutralHex(color) } : undefined} />;
}
