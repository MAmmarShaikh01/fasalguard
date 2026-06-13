export interface TopPrediction {
  label: string;
  score: number;
}

export interface DiagnosticResult {
  disease: string;
  plant_name?: string;
  watering?: {
    frequency: string;
    amount: string;
    tips: string;
    sunlight: string;
  } | null;
  confidence: number;
  severity_percentage: number;
  treatment?: string;
  warnings?: string[];
  top_predictions?: TopPrediction[];
  timestamp: number;
  imageUri?: string;
  latitude?: number;
  longitude?: number;
}

export interface QualityResult {
  is_blurry: boolean;
  is_too_dark: boolean;
  likely_leaf: boolean;
  laplacian_variance: number;
  mean_brightness: number;
  green_ratio: number;
  blur_score: number;
  brightness_score: number;
  passed: boolean;
}

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  timestamp: number;
}

export interface PlantIdentification {
  plant_name: string | null;
  confidence: number;
  green_ratio?: number;
  warning?: string;
  top_predictions: TopPrediction[];
  timestamp: number;
  imageUri?: string;
}

export type Screen = "loading" | "camera" | "result" | "history" | "chat" | "about";
