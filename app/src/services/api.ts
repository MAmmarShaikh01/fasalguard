import axios from "axios";
import type { ChatMessage, DiagnosticResult, PlantIdentification, QualityResult } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://Ammar5525-fasalguard.hf.space";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

function formatDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => `${e.loc?.join(".") || "?"}: ${e.msg}`).join("; ");
  }
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return String(detail);
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response) {
      const detail = error.response.data?.detail;
      const msg = detail ? formatDetail(detail) : error.response.statusText;
      return Promise.reject(new Error(`Server error (${error.response.status}): ${msg}`));
    }
    if (error.request) {
      return Promise.reject(new Error("No response from server. Check your connection and ensure the backend is running."));
    }
    return Promise.reject(new Error(error.message || "An unexpected error occurred"));
  }
);

function buildFormData(imageUri: string): FormData {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "leaf.jpg",
  } as any);
  return formData;
}

function buildFormDataFromFile(file: File): FormData {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

export async function predictLeaf(imageUri: string): Promise<DiagnosticResult> {
  const { data } = await api.post<DiagnosticResult>("/api/predict", buildFormData(imageUri));
  return { ...data, timestamp: Date.now() };
}

export async function predictLeafFromFile(file: File): Promise<DiagnosticResult> {
  const { data } = await api.post<DiagnosticResult>("/api/predict", buildFormDataFromFile(file));
  return { ...data, timestamp: Date.now() };
}

export async function checkQuality(imageUri: string): Promise<QualityResult> {
  const { data } = await api.post<QualityResult>("/api/quality", buildFormData(imageUri));
  return data;
}

export async function checkQualityFromFile(file: File): Promise<QualityResult> {
  const { data } = await api.post<QualityResult>("/api/quality", buildFormDataFromFile(file));
  return data;
}

export async function identifyPlant(imageUri: string): Promise<PlantIdentification> {
  const { data } = await api.post<PlantIdentification>("/api/identify-plant", buildFormData(imageUri));
  return { ...data, timestamp: Date.now() };
}

export async function identifyPlantFromFile(file: File): Promise<PlantIdentification> {
  const { data } = await api.post<PlantIdentification>("/api/identify-plant", buildFormDataFromFile(file));
  return { ...data, timestamp: Date.now() };
}

export async function healthCheck(): Promise<boolean> {
  try {
    await api.get("/api/health");
    return true;
  } catch {
    return false;
  }
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  lastDiagnosis?: DiagnosticResult | null,
  diagnosisHistory?: DiagnosticResult[]
): Promise<string> {
  const { data } = await api.post<{ reply: string }>("/api/chat", {
    message,
    history: history.map((h) => ({ role: h.role, text: h.text })),
    last_diagnosis: lastDiagnosis ?? null,
    diagnosis_history: (diagnosisHistory ?? []).map((d) => ({
      disease: d.disease,
      confidence: d.confidence,
      severity_percentage: d.severity_percentage,
      timestamp: d.timestamp,
    })),
  });
  return data.reply;
}
