import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendChat } from '../services/chatApi';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const starterMessages: ChatMessage[] = [
  {
    id: 'assistant-intro',
    role: 'assistant',
    content:
      'I am your astrology guide. Ask me about tarot spreads, palm lines, face zones, or your next steps.',
  },
];

const quickPrompts = [
  'Interpret my last tarot pull.',
  'What does a deep head line mean?',
  'Face reading for leadership traits?',
  'How to prepare for a palm scan?',
];

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const scrollToEnd = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    scrollToEnd();

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const assistantText = await sendChat({
        systemPrompt,
        messages: history.concat({ role: 'user', content: text.trim() }),
      });

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      scrollToEnd();
    } catch (err) {
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: 'I had trouble reaching the stars. Please try again in a moment.',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <LinearGradient colors={['#0f1027', '#090815']} style={styles.hero}>
        <Text style={styles.kicker}>Astro AI Oracle</Text>
        <Text style={styles.headline}>Ask an astrology master.</Text>
        <Text style={styles.subhead}>
          Tarot, palmistry, face reading—get tailored guidance, rituals, and next steps.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {quickPrompts.map((q) => (
            <Pressable key={q} style={styles.chip} onPress={() => sendMessage(q)}>
              <Text style={styles.chipText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
        onContentSizeChange={scrollToEnd}
      />

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your lines, cards, or face zones..."
          placeholderTextColor="#8b8ca7"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || isSending) && { opacity: 0.6 }]}
          disabled={!input.trim() || isSending}
          onPress={() => sendMessage(input)}
        >
          {isSending ? <ActivityIndicator color="#0b0a1f" /> : <Ionicons name="send" size={18} color="#0b0a1f" />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const systemPrompt =
  'You are an expert astrology guide. You explain tarot (upright/reversed), palmistry (lines, mounts), and Chinese face reading zones. Be concise, warm, and practical. Offer next steps when helpful.';

function fallbackResponse(userText: string): string {
  return `Here’s a quick perspective on "${userText}":\n\n` +
    '• Tarot: Anchor a 3-card spread—past, present, guidance.\n' +
    '• Palm: Check your heart, head, life, and fate lines for balance.\n' +
    '• Face: Forehead shows strategy, eyes reveal empathy, nose reflects drive, mouth signals expression.\n' +
    'Close with a grounding breath and set one clear intention.';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090815' },
  hero: { paddingHorizontal: 16, paddingVertical: 16 },
  kicker: {
    color: '#c1c4ff',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headline: { color: '#fff', fontSize: 22, fontFamily: 'PoppinsBold', marginBottom: 4 },
  subhead: { color: '#d8daf4', fontSize: 14, lineHeight: 20 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    marginRight: 10,
  },
  chipText: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 12 },
  bubble: {
    maxWidth: '88%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#7c3aed',
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bubbleText: { fontSize: 14, lineHeight: 20, fontFamily: 'Poppins' },
  userText: { color: '#0b0a1f' },
  assistantText: { color: '#d8daf4' },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#0d0c1f',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    fontFamily: 'Poppins',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
