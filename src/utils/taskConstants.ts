import { Ionicons } from "@expo/vector-icons";
import { TaskType } from "../types/database.types";

export const TASK_DUE_TIME_HOUR = 18; // 6:00 PM
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const TASK_EMOJIS: Record<TaskType, string> = {
  water: "💧",
  fertilise: "🌿",
  prune: "✂️",
  repot: "🪴",
  spray: "💨",
  mulch: "🍂",
  harvest: "🧺",
};

export const TASK_COLORS: Record<TaskType, string> = {
  water: "#2196F3",
  fertilise: "#FF9800",
  prune: "#9C27B0",
  repot: "#4CAF50",
  spray: "#00BCD4",
  mulch: "#795548",
  harvest: "#8BC34A",
};

export const TASK_ICONS: Record<TaskType, keyof typeof Ionicons.glyphMap> = {
  water: "water",
  fertilise: "nutrition",
  prune: "cut",
  repot: "move",
  spray: "sparkles",
  mulch: "layers",
  harvest: "basket",
};

export const TASK_LABELS: Record<TaskType, string> = {
  water: "Water",
  fertilise: "Fertilise",
  prune: "Prune",
  repot: "Repot",
  spray: "Spray",
  mulch: "Mulch",
  harvest: "Harvest",
};
