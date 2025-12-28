import axios from 'axios';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const fallbackResponse = (userText: string): string =>
  `Quick take on "${userText}":\n` +
  '• Tarot: try a 3-card spread—past, present, guidance.\n' +
  '• Palm: notice heart, head, life, fate lines balance.\n' +
  '• Face: forehead strategy, eyes empathy, nose drive, mouth expression.\n' +
  'Ground with one clear intention today.`;

export async function sendChat({
  systemPrompt,
  messages,
}: {
  systemPrompt: string;
  messages: ChatMessage[];
}): Promise<string> {
  const endpoint = process.env.EXPO_PUBLIC_CHAT_ENDPOINT;

  // If no endpoint, return fallback.
  if (!endpoint) {
    return fallbackResponse(messages[messages.length - 1]?.content || '');
  }

  // Supports either an OpenAI-compatible proxy or a custom handler that returns {message: {content}}.
  const payload = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  };

  const { data } = await axios.post(endpoint, payload, { timeout: 20000 });
  return (
    data?.choices?.[0]?.message?.content || // OpenAI format
    data?.message?.content || // custom proxy
    data?.content || // simple string
    fallbackResponse(messages[messages.length - 1]?.content || '')
  );
}
