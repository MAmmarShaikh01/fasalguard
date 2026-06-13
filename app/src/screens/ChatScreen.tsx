import { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeInUp, FadeIn, FadeInDown } from "react-native-reanimated";
import { MessageCircle, SendHorizonal, Eraser, Bot, User, Sparkles } from "lucide-react-native";
import { useDiagnosticStore } from "../store/useDiagnosticStore";
import { sendChatMessage } from "../services/api";
import { colors, shadows, borderRadius, typography } from "../theme";
import type { ChatMessage } from "../types";

const SUGGESTIONS: string[] = [];

export function ChatScreen() {
  const chatHistory = useDiagnosticStore((s) => s.chatHistory);
  const currentResult = useDiagnosticStore((s) => s.currentResult);
  const addChatMessage = useDiagnosticStore((s) => s.addChatMessage);
  const isChatLoading = useDiagnosticStore((s) => s.isChatLoading);
  const setChatLoading = useDiagnosticStore((s) => s.setChatLoading);
  const clearChat = useDiagnosticStore((s) => s.clearChat);
  const scanHistory = useDiagnosticStore((s) => s.history);

  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [chatHistory.length, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isChatLoading) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", text, timestamp: Date.now() };
    addChatMessage(userMsg);
    setChatLoading(true);
    try {
      const reply = await sendChatMessage(text, [...chatHistory, userMsg], currentResult, scanHistory);
      addChatMessage({ role: "bot", text: reply, timestamp: Date.now() });
    } catch {
      addChatMessage({ role: "bot", text: "The treatment assistant is unavailable. Make sure GROQ_API_KEY is set on the backend.", timestamp: Date.now() });
    } finally { setChatLoading(false); }
  }, [input, isChatLoading, chatHistory, currentResult, addChatMessage, setChatLoading]);

  const handleSuggestion = useCallback((text: string) => setInput(text), []);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <Animated.View entering={FadeInUp.duration(300).springify()} style={[styles.messageRow, isUser && styles.userRow]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Bot size={16} stroke={colors.primary} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, isUser && styles.userText]}>{item.text}</Text>
        </View>
        {isUser && (
          <View style={[styles.avatar, styles.userAvatar]}>
            <User size={16} stroke="#fff" />
          </View>
        )}
      </Animated.View>
    );
  }, []);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Bot size={20} stroke="#fff" />
        </View>
        <Text style={styles.title}>Treatment Assistant</Text>
        {chatHistory.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Eraser size={18} stroke={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {chatHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Animated.View entering={FadeIn.duration(600)}>
            <View style={styles.emptyIconWrap}>
              <MessageCircle size={40} stroke="#fff" />
            </View>
          </Animated.View>
          <Text style={styles.emptyTitle}>Treatment Assistant</Text>
          <Text style={styles.emptyText}>
            Ask about plant diseases, symptoms, treatments, or prevention methods. The AI will use your scan results as context if available.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatHistory}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          showsVerticalScrollIndicator={false}
        />
      )}

      {isChatLoading && (
        <View style={styles.typing}>
          <View style={styles.typingBubble}>
            <View style={[styles.dot, { animationDelay: "0s" }]} />
            <View style={[styles.dot, { animationDelay: "0.2s" }]} />
            <View style={[styles.dot, { animationDelay: "0.4s" }]} />
          </View>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about treatments..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isChatLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isChatLoading}
          activeOpacity={0.8}
        >
          <SendHorizonal size={20} stroke="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  headerIconWrap: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", color: colors.primaryDeep, flex: 1 },
  clearButton: { padding: 6, backgroundColor: colors.bg, borderRadius: borderRadius.sm },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", ...shadows.glow(colors.primary) },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.textSecondary, textAlign: "center" },
  emptyText: { fontSize: 14, color: colors.textTertiary, textAlign: "center", lineHeight: 20 },
  messageList: { padding: 16, gap: 12, paddingBottom: 8 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  userRow: { justifyContent: "flex-end" },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryBg, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.primaryLight },
  userAvatar: { backgroundColor: colors.primary, borderColor: colors.primary },
  messageBubble: { maxWidth: "78%", padding: 14, borderRadius: 18 },
  userBubble: { backgroundColor: colors.primary, alignSelf: "flex-end", borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: colors.surface, alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#f1f5f9", ...shadows.sm },
  messageText: { fontSize: 15, lineHeight: 22, color: colors.text },
  userText: { color: "#fff" },
  typing: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 4, paddingLeft: 24 },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, opacity: 0.6 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, paddingBottom: Platform.OS === "ios" ? 28 : 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  input: { flex: 1, backgroundColor: colors.bg, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, color: colors.text },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", ...shadows.glow(colors.primary) },
  sendButtonDisabled: { opacity: 0.5, boxShadow: "none", elevation: 0 },
});
