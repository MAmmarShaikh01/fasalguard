import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage, DiagnosticResult, Screen } from "../types";

interface DiagnosticState {
  currentScreen: Screen;
  currentResult: DiagnosticResult | null;
  capturedImageUri: string | null;
  isProcessing: boolean;
  error: string | null;
  history: DiagnosticResult[];
  chatHistory: ChatMessage[];
  isChatLoading: boolean;

  setScreen: (screen: Screen) => void;
  setCapturedImage: (uri: string) => void;
  setResult: (result: DiagnosticResult) => void;
  setProcessing: (v: boolean) => void;
  setError: (e: string | null) => void;
  addToHistory: (r: DiagnosticResult) => void;
  reset: () => void;
  restoreResult: (r: DiagnosticResult) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatLoading: (v: boolean) => void;
  clearChat: () => void;
  clearHistory: () => void;
}

export const useDiagnosticStore = create<DiagnosticState>()(
  persist(
    (set) => ({
      currentScreen: "loading",
      currentResult: null,
      capturedImageUri: null,
      isProcessing: false,
      error: null,
      history: [],
      chatHistory: [],
      isChatLoading: false,

      setScreen: (screen) => set({ currentScreen: screen }),
      setCapturedImage: (uri) => set({ capturedImageUri: uri }),
      setResult: (result) => set({ currentResult: result }),
      setProcessing: (v) => set({ isProcessing: v }),
      setError: (e) => set({ error: e }),
      addToHistory: (r) => set((s) => ({ history: [r, ...s.history].slice(0, 100) })),
      reset: () =>
        set({
          currentResult: null,
          capturedImageUri: null,
          isProcessing: false,
          error: null,
        }),
      restoreResult: (r) => set({ currentResult: r, currentScreen: "result" }),
      addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
      setChatLoading: (v) => set({ isChatLoading: v }),
      clearChat: () => set({ chatHistory: [] }),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "fasalguard-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        history: state.history,
        chatHistory: state.chatHistory,
      }),
    }
  )
);
