import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import tarotCards from '../data/tarot_major_arcana_full.json';
import tarotExpanded from '../data/tarot_reading_expanded.json';
import TarotCard from '../components/TarotCard';
import tarotImageMap from '../assets/tarotImageMap';

const MAX_CARDS = {
  Daily: 1,
  Quick: 3,
  Celtic: 10,
};
const DAILY_LIMIT = 3; // total readings per calendar day
const USAGE_KEY = 'tarot_daily_usage';

const readingTypes = ['Daily', 'Quick', 'Celtic'] as const;
type ReadingType = typeof readingTypes[number];

export default function TarotScreen() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [flippedIds, setFlippedIds] = useState<Set<number>>(new Set());
  const [showReading, setShowReading] = useState(false);
  const [readingType, setReadingType] = useState<ReadingType>('Daily');
  const [readsToday, setReadsToday] = useState(0);
  const [hasRecordedReading, setHasRecordedReading] = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [limitBanner, setLimitBanner] = useState<string | null>(null);
  const openTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [dob, setDob] = useState('');
  const [inputBanner, setInputBanner] = useState<string | null>(null);

  const remaining = Math.max(DAILY_LIMIT - readsToday, 0);
  const limitReached = remaining === 0;

  useEffect(() => {
    loadUsage();
    return () => {
      if (openTimeout.current) clearTimeout(openTimeout.current);
    };
  }, []);

  useEffect(() => {
    setHasRecordedReading(false);
  }, [selectedIds.length, readingType]);

  useEffect(() => {
    const max = MAX_CARDS[readingType];
    if (selectedIds.length === max && !hasRecordedReading) {
      if (readsToday >= DAILY_LIMIT) {
        setLimitBanner('Daily limit reached. Come back tomorrow for a fresh draw.');
        return;
      }
      openTimeout.current = setTimeout(() => {
        setShowReading(true);
        setHasRecordedReading(true);
        recordReading();
      }, 500);
    }
  }, [selectedIds, readingType, readsToday, hasRecordedReading]);

  const handleSelect = (id: number) => {
    if (readsToday >= DAILY_LIMIT) {
      setLimitBanner('Daily limit reached. Come back tomorrow for a fresh draw.');
      return;
    }
    if (!isReadyForReading()) {
      setInputBanner('Add your date of birth and choose an intent to personalize the reading.');
      return;
    }
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((cardId) => cardId !== id));
    } else if (selectedIds.length < MAX_CARDS[readingType]) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const onCardPress = (id: number) => {
    if (limitReached) {
      setLimitBanner('Daily limit reached. Come back tomorrow for a fresh draw.');
      return;
    }
    if (!isReadyForReading()) {
      setInputBanner('Add your date of birth and choose an intent to personalize the reading.');
      return;
    }
    setFlippedIds((prev) => new Set(prev).add(id));
    handleSelect(id);
  };

  const selectedCards = tarotCards.filter((card) => selectedIds.includes(card.id));

  const handleCloseModal = () => {
    setShowReading(false);
    setSelectedIds([]);
    setHasRecordedReading(false);
  };

  const handleTabSwitch = (type: ReadingType) => {
    setReadingType(type);
    setSelectedIds([]);
    setFlippedIds(new Set());
    setShowReading(false);
    setHasRecordedReading(false);
    setLimitBanner(null);
  };

  const loadUsage = async () => {
    try {
      const stored = await AsyncStorage.getItem(USAGE_KEY);
      const today = new Date().toISOString().slice(0, 10);
      if (stored) {
        const parsed = JSON.parse(stored) as { date: string; count: number };
        if (parsed.date === today) {
          setReadsToday(parsed.count);
        } else {
          await AsyncStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
          setReadsToday(0);
        }
      } else {
        await AsyncStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        setReadsToday(0);
      }
    } catch (err) {
      setReadsToday(0);
    } finally {
      setLoadingUsage(false);
    }
  };

  const recordReading = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const nextCount = Math.min(readsToday + 1, DAILY_LIMIT);
    setReadsToday(nextCount);
    try {
      await AsyncStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count: nextCount }));
    } catch (err) {
      // ignore storage failure
    }
  };

  const isReadyForReading = () => {
    const dobValid = /^\d{4}-\d{2}-\d{2}$/.test(dob.trim());
    return !!intent && dobValid;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
      <LinearGradient colors={['#0f1027', '#090815']} style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.kicker}>Tarot Concierge</Text>
          <Text style={styles.headline}>Pull the cards. Get clarity.</Text>
          <Text style={styles.subhead}>
            Choose a spread, tap cards to flip, and reveal tailored meanings. Daily limit keeps readings mindful.
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <Text style={styles.statusValue}>{remaining}</Text>
              <Text style={styles.statusLabel}>Reads left today</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusValue}>{readingType}</Text>
              <Text style={styles.statusLabel}>Spread</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.cardSurface}>
        {loadingUsage ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#7c3aed" />
          </View>
        ) : (
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={tarotCards}
            keyExtractor={(item) => item.id.toString()}
            numColumns={5}
            ListHeaderComponent={
              <View>
                <View style={styles.contextCard}>
                  <Text style={styles.contextTitle}>Personalize your reading</Text>
                  <Text style={styles.contextHint}>Add your date of birth and intent to unlock the cards.</Text>
                  <View style={styles.intentRow}>
                    {['Love', 'Career', 'Wealth', 'Health', 'Clarity', 'Spiritual'].map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setIntent(item);
                          setInputBanner(null);
                        }}
                        style={[
                          styles.intentChip,
                          intent === item && { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.intentText,
                            intent === item && { color: '#0b0a1f', fontFamily: 'PoppinsBold' },
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    style={styles.dobInput}
                    placeholder="Date of birth (YYYY-MM-DD)"
                    placeholderTextColor="#8b8ca7"
                    value={dob}
                    onChangeText={(text) => {
                      setDob(text);
                      setInputBanner(null);
                    }}
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    blurOnSubmit
                  />
                  {!isReadyForReading() && <Text style={styles.validation}>Required for a personalized spread.</Text>}
                </View>

                <View style={styles.tabRow}>
                  {readingTypes.map((type) => (
                    <Pressable
                      key={type}
                      style={[styles.tab, readingType === type && styles.tabSelected]}
                      onPress={() => {
                        handleTabSwitch(type);
                      }}
                    >
                      <Text style={[styles.tabText, readingType === type && styles.tabTextSelected]}>{type}</Text>
                    </Pressable>
                  ))}
                </View>

                {(limitBanner || inputBanner) && (
                  <View style={styles.banner}>
                    <Text style={styles.bannerText}>{limitBanner || inputBanner}</Text>
                  </View>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <TarotCard
                card={item}
                flipped={flippedIds.has(item.id)}
                isSelected={selectedIds.includes(item.id)}
                onPress={() => onCardPress(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
      </View>

      <Modal visible={showReading} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ScrollView>
              <Text style={styles.modalHeaderTitle}>{readingType} reading</Text>
              <Text style={styles.modalHint}>
                You drew {selectedIds.length} card{selectedIds.length > 1 ? 's' : ''}. Interpretations include upright or reversed pulls.
              </Text>
              <View style={styles.contextSummary}>
                <Text style={styles.contextSummaryText}>Intent: {intent || '—'}</Text>
                <Text style={styles.contextSummaryText}>DOB: {dob || '—'}</Text>
              </View>
              {selectedCards.map((card, index) => {
                const isReversed = Math.random() > 0.5;
                const expanded = (tarotExpanded as any)[card.name];
                const extraText = isReversed ? expanded?.reversed : expanded?.upright;
                return (
                  <View key={index} style={styles.modalCard}>
                    <Image source={tarotImageMap[card.image]} style={styles.modalImage} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalCardTitle}>
                        {card.name} ({isReversed ? 'Reversed' : 'Upright'})
                      </Text>
                      <Text style={styles.modalCardText}>
                        {isReversed ? card.meaning_reversed : card.meaning_upright}
                      </Text>
                      {extraText && <Text style={styles.modalCardTextMuted}>{extraText}</Text>}
                      {intent && (
                        <Text style={styles.modalAdvice}>
                          Guidance for {intent.toLowerCase()}: align actions with the themes above today.
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
              <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090815',
  },
  hero: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  heroLeft: {
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
  headline: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'PoppinsBold',
    marginBottom: 6,
  },
  subhead: {
    color: '#d8daf4',
    fontSize: 14,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  statusPill: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusValue: { color: '#fff', fontSize: 16, fontFamily: 'PoppinsBold' },
  statusLabel: { color: '#b2b4d1', fontSize: 12, fontFamily: 'Poppins' },
  cardSurface: {
    flex: 1,
    margin: 12,
    padding: 12,
    backgroundColor: '#0d0c1f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    marginTop: 6,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  tabText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#d8daf4',
  },
  tabTextSelected: {
    color: '#fff',
    fontFamily: 'PoppinsBold',
  },
  banner: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(250, 173, 20, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(250, 173, 20, 0.35)',
    marginBottom: 10,
  },
  bannerText: { color: '#fbd38d', fontFamily: 'PoppinsBold', fontSize: 13 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeaderTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 18,
    marginBottom: 4,
  },
  modalHint: {
    fontFamily: 'Poppins',
    fontSize: 13,
    marginBottom: 10,
    color: '#444',
  },
  modalCard: {
    marginBottom: 15,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  modalImage: {
    width: 70,
    height: 120,
    borderRadius: 8,
  },
  modalCardTitle: {
    fontFamily: 'PoppinsBold',
    marginTop: 2,
    marginBottom: 4,
  },
  modalCardText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    marginTop: 2,
    color: '#444',
  },
  modalCardTextMuted: {
    fontFamily: 'Poppins',
    fontSize: 12,
    marginTop: 6,
    color: '#666',
  },
  modalAdvice: {
    fontFamily: 'PoppinsBold',
    fontSize: 12,
    marginTop: 8,
    color: '#7c3aed',
  },
  closeText: {
    textAlign: 'center',
    fontFamily: 'PoppinsBold',
    color: '#fff',
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  contextCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  contextTitle: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 15 },
  contextHint: { color: '#c9c9df', fontFamily: 'Poppins', fontSize: 12, marginTop: 2 },
  intentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  intentChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  intentText: { color: '#d8daf4', fontFamily: 'Poppins', fontSize: 12 },
  dobInput: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.04)',
    fontFamily: 'Poppins',
  },
  validation: { color: '#fbd38d', fontFamily: 'Poppins', fontSize: 11, marginTop: 4 },
  contextSummary: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contextSummaryText: { color: '#4b3a8e', fontFamily: 'PoppinsBold', fontSize: 12 },
});
