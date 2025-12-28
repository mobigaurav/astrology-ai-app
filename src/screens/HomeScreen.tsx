import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const TAROT_USAGE_KEY = 'tarot_daily_usage';
const TAROT_DAILY_LIMIT = 3;

type Nav = ReturnType<typeof useNavigation>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [tarotReads, setTarotReads] = useState(0);
  const [loadingTarot, setLoadingTarot] = useState(true);

  useEffect(() => {
    loadTarotUsage();
  }, []);

  const loadTarotUsage = async () => {
    try {
      const stored = await AsyncStorage.getItem(TAROT_USAGE_KEY);
      const today = new Date().toISOString().slice(0, 10);
      if (stored) {
        const parsed = JSON.parse(stored) as { date: string; count: number };
        if (parsed.date === today) {
          setTarotReads(parsed.count);
        } else {
          await AsyncStorage.setItem(TAROT_USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
          setTarotReads(0);
        }
      } else {
        await AsyncStorage.setItem(TAROT_USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        setTarotReads(0);
      }
    } catch (err) {
      setTarotReads(0);
    } finally {
      setLoadingTarot(false);
    }
  };

  const remainingTarot = Math.max(TAROT_DAILY_LIMIT - tarotReads, 0);

  const quickCards = [
    {
      id: 'zodiac',
      title: 'Zodiac & Horoscope',
      subtitle: 'Daily to yearly',
      icon: 'planet',
      action: () => navigation.navigate('Zodiac' as never),
      state: 'Find your sign',
    },
    {
      id: 'numerology',
      title: 'Numerology',
      subtitle: 'Life Path & name',
      icon: 'calculator',
      action: () => navigation.navigate('Numerology' as never),
      state: 'Get your numbers',
    },
    {
      id: 'tarot',
      title: 'Tarot',
      subtitle: 'Pull a spread',
      icon: 'layers',
      action: () => navigation.navigate('Tarot' as never),
      state: loadingTarot ? 'Loading...' : `${remainingTarot} reads left today`,
    },
    {
      id: 'chat',
      title: 'AI Chat',
      subtitle: 'Ask anything',
      icon: 'chatbubbles',
      action: () => navigation.navigate('AI Chat' as never),
      state: 'Guidance on demand',
    },
  ];

  const emptyState = tarotReads === 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <LinearGradient colors={['#0f1027', '#090815']} style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>Astro AI Studio</Text>
            <Text style={styles.headline}>Your mystical companion, in one place.</Text>
            <Text style={styles.subhead}>
              Explore zodiac insights and tarot with AI-guided clarity and intentional pacing.
            </Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{loadingTarot ? '—' : remainingTarot}</Text>
              <Text style={styles.statLabel}>Tarot reads left today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Daily</Text>
              <Text style={styles.statLabel}>Horoscope cadence</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Ready</Text>
              <Text style={styles.statLabel}>AI Chat</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <Text style={styles.sectionHint}>Jump into any reading or ask the AI</Text>
          </View>
          <View style={styles.quickGrid}>
            {quickCards.map((card) => (
              <Pressable key={card.id} style={styles.quickCard} onPress={card.action}>
                <View style={styles.quickIcon}>
                  <Ionicons name={card.icon as any} size={20} color="#7c3aed" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>{card.title}</Text>
                  <Text style={styles.quickSubtitle}>{card.subtitle}</Text>
                  <Text style={styles.quickState}>{card.state}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ea0c7" />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Text style={styles.sectionHint}>A snapshot of your latest guidance</Text>
          </View>
          {emptyState ? (
            <View style={styles.emptyCard}>
              <Ionicons name="sparkles" size={20} color="#7c3aed" />
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyTitle}>No readings yet</Text>
                <Text style={styles.emptySubtitle}>Start with a zodiac check or tarot pull to unlock insights.</Text>
              </View>
              <Pressable style={styles.ctaButton} onPress={() => navigation.navigate('Tarot' as never)}>
                <Text style={styles.ctaText}>Begin</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.activityList}>
              <View style={styles.activityRow}>
                <Ionicons name="layers" size={18} color="#7c3aed" />
                <Text style={styles.activityText}>
                  Tarot pulls today: {loadingTarot ? '—' : tarotReads}/{TAROT_DAILY_LIMIT}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090815' },
  hero: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12 },
  heroText: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  kicker: {
    color: '#c1c4ff',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headline: { color: '#fff', fontSize: 22, fontFamily: 'PoppinsBold', marginBottom: 6 },
  subhead: { color: '#d8daf4', fontSize: 14, lineHeight: 20 },
  heroStats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: { color: '#fff', fontSize: 18, fontFamily: 'PoppinsBold' },
  statLabel: { color: '#b2b4d1', fontSize: 12, fontFamily: 'Poppins' },
  section: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#0d0c1f',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeader: { marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontFamily: 'PoppinsBold' },
  sectionHint: { color: '#b6b7d6', fontSize: 13, fontFamily: 'Poppins' },
  quickGrid: { gap: 10 },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 15 },
  quickSubtitle: { color: '#c9c9df', fontFamily: 'Poppins', fontSize: 13 },
  quickState: { color: '#9ea0c7', fontFamily: 'Poppins', fontSize: 12 },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  emptyTitle: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 15 },
  emptySubtitle: { color: '#d7d9f4', fontFamily: 'Poppins', fontSize: 12 },
  ctaButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
  },
  ctaText: { color: '#0b0a1f', fontFamily: 'PoppinsBold' },
  activityList: { gap: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activityText: { color: '#d8daf4', fontFamily: 'Poppins', fontSize: 13 },
});
