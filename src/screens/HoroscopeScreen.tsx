import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const zodiacRanges = [
  { sign: 'Aries', start: '03-21', end: '04-19' },
  { sign: 'Taurus', start: '04-20', end: '05-20' },
  { sign: 'Gemini', start: '05-21', end: '06-20' },
  { sign: 'Cancer', start: '06-21', end: '07-22' },
  { sign: 'Leo', start: '07-23', end: '08-22' },
  { sign: 'Virgo', start: '08-23', end: '09-22' },
  { sign: 'Libra', start: '09-23', end: '10-22' },
  { sign: 'Scorpio', start: '10-23', end: '11-21' },
  { sign: 'Sagittarius', start: '11-22', end: '12-21' },
  { sign: 'Capricorn', start: '12-22', end: '01-19' },
  { sign: 'Aquarius', start: '01-20', end: '02-18' },
  { sign: 'Pisces', start: '02-19', end: '03-20' },
];

const defaultHoroscope = {
  daily: 'Stay open to small synchronicities; a short chat may shift your outlook.',
  weekly: 'Clear one lingering task; your energy frees up for a new opportunity.',
  monthly: 'Balance ambition with rest; your best ideas land when you recharge.',
  yearly: 'A steady year of growth—focus on one key goal each quarter.',
};

const horoscopeBySign: Record<string, typeof defaultHoroscope> = {
  Aries: {
    daily: 'Act boldly today; a quick decision opens a new path.',
    weekly: 'Channel courage into one focused move; avoid rushing many things.',
    monthly: 'Leadership moments arrive—step up with empathy.',
    yearly: 'Forge alliances; partnerships amplify your fire.',
  },
  Taurus: {
    daily: 'Ground yourself; a small ritual brings calm.',
    weekly: 'Stability comes from simplifying commitments.',
    monthly: 'Invest in comfort and health; it fuels steady progress.',
    yearly: 'Build patiently; slow gains compound.',
  },
  Gemini: {
    daily: 'A conversation reveals an unexpected insight.',
    weekly: 'Share your ideas; collaboration sparks momentum.',
    monthly: 'Curiosity leads to a helpful connection.',
    yearly: 'Communicate clearly; your words shape your year.',
  },
  Cancer: {
    daily: 'Lean on your intuition; home comforts restore you.',
    weekly: 'Nurture important relationships; reciprocity grows.',
    monthly: 'Set boundaries with care; protect your energy.',
    yearly: 'Emotional resilience brings long-term stability.',
  },
  Leo: {
    daily: 'Express yourself; your warmth draws allies.',
    weekly: 'Lead by example; your confidence inspires.',
    monthly: 'Creative risk pays off; share your work.',
    yearly: 'Visibility increases; stay authentic and humble.',
  },
  Virgo: {
    daily: 'Organize one messy corner; clarity follows.',
    weekly: 'Refine routines; small tweaks bring big relief.',
    monthly: 'Health and habits align—prioritize rest.',
    yearly: 'Systems you build now support a stable year.',
  },
  Libra: {
    daily: 'Seek balance in decisions; hear all sides.',
    weekly: 'Diplomacy wins; mediate and find the middle.',
    monthly: 'Beauty and harmony inspire progress.',
    yearly: 'Relationships deepen; set fair boundaries.',
  },
  Scorpio: {
    daily: 'Focus deeply; a hidden detail reveals power.',
    weekly: 'Transform an old pattern; release what drains you.',
    monthly: 'Intuition heightens—journal insights.',
    yearly: 'Strategic moves lead to meaningful change.',
  },
  Sagittarius: {
    daily: 'Explore a new idea; learning energizes you.',
    weekly: 'Expand your horizons; short trips or studies help.',
    monthly: 'Optimism fuels action; avoid overcommitting.',
    yearly: 'Growth through adventure; stay grounded in your values.',
  },
  Capricorn: {
    daily: 'Take a practical step toward a long-term goal.',
    weekly: 'Discipline rewards you; plan, then act.',
    monthly: 'Career focus sharpens; delegate when possible.',
    yearly: 'Persistent effort brings status and stability.',
  },
  Aquarius: {
    daily: 'Think differently; innovation solves a snag.',
    weekly: 'Community matters—share your vision.',
    monthly: 'Friendships strengthen; collaborate on change.',
    yearly: 'Originality shines; guard your energy.',
  },
  Pisces: {
    daily: 'Listen to your intuition; creativity flows.',
    weekly: 'Rest and dream; insights surface quietly.',
    monthly: 'Spiritual practices nourish you.',
    yearly: 'Compassion leads; protect your boundaries.',
  },
};

function getSignFromDate(date: string): string | null {
  const parts = date.split('-');
  if (parts.length !== 3) return null;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day)) return null;

  const mmdd = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Check Capricorn wrap
  const cap = zodiacRanges.find((z) => z.sign === 'Capricorn')!;
  const inCap =
    (mmdd >= cap.start && mmdd <= '12-31') ||
    (mmdd >= '01-01' && mmdd <= cap.end);
  if (inCap) return 'Capricorn';

  for (const z of zodiacRanges.filter((z) => z.sign !== 'Capricorn')) {
    if (mmdd >= z.start && mmdd <= z.end) return z.sign;
  }
  return null;
}

export default function HoroscopeScreen() {
  const [dob, setDob] = useState('');
  const [sign, setSign] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [compatSignA, setCompatSignA] = useState<string | null>(null);
  const [compatSignB, setCompatSignB] = useState<string | null>(null);

  const selectedSign = useMemo(() => {
    if (sign) return sign;
    const derived = getSignFromDate(dob);
    return derived;
  }, [sign, dob]);

  const horoscope = (selectedSign && horoscopeBySign[selectedSign]) || defaultHoroscope;

  const handleFind = () => {
    const derived = getSignFromDate(dob);
    if (!derived) {
      setError('Enter DOB as YYYY-MM-DD to find your sign.');
      return;
    }
    setError(null);
    setSign(derived);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <LinearGradient colors={['#111126', '#090815']} style={styles.hero}>
          <Text style={styles.kicker}>Zodiac & Horoscope</Text>
          <Text style={styles.headline}>Daily to yearly guidance</Text>
          <Text style={styles.subhead}>
            Insights tailored to your sign. Need help? Find your sign below.
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Find your sign</Text>
          <Text style={styles.cardHint}>Enter your date of birth (YYYY-MM-DD). Optional: name, place, and time.</Text>
          <TextInput
            style={styles.input}
            placeholder="Name (optional)"
            placeholderTextColor="#8b8ca7"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#8b8ca7"
            value={dob}
            onChangeText={(text) => {
              setDob(text);
              setError(null);
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Place of birth (optional)"
            placeholderTextColor="#8b8ca7"
            value={birthPlace}
            onChangeText={setBirthPlace}
          />
          <TextInput
            style={styles.input}
            placeholder="Time of birth (optional, HH:MM)"
            placeholderTextColor="#8b8ca7"
            value={birthTime}
            onChangeText={setBirthTime}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.signRow}>
            <View>
              <Text style={styles.signLabel}>Your sign</Text>
              <Text style={styles.signValue}>{selectedSign ?? '—'}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={handleFind}>
              <Text style={styles.primaryText}>Find sign</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selectedSign || 'Your horoscope'}</Text>
          <Text style={styles.cardHint}>Daily, weekly, monthly, and yearly reads.</Text>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Daily</Text>
            <Text style={styles.sectionText}>{horoscope.daily}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Weekly</Text>
            <Text style={styles.sectionText}>{horoscope.weekly}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Monthly</Text>
            <Text style={styles.sectionText}>{horoscope.monthly}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Yearly</Text>
            <Text style={styles.sectionText}>{horoscope.yearly}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Compatibility</Text>
          <Text style={styles.cardHint}>Pick two signs to see a quick match score.</Text>
          <Text style={styles.signLabel}>You</Text>
          <View style={styles.chipRow}>
            {zodiacRanges.map((z) => (
              <Pressable
                key={z.sign}
                style={[
                  styles.intentChip,
                  compatSignA === z.sign && { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
                ]}
                onPress={() => setCompatSignA(z.sign)}
              >
                <Text
                  style={[
                    styles.intentText,
                    compatSignA === z.sign && { color: '#0b0a1f', fontFamily: 'PoppinsBold' },
                  ]}
                >
                  {z.sign}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.signLabel}>Partner</Text>
          <View style={styles.chipRow}>
            {zodiacRanges.map((z) => (
              <Pressable
                key={z.sign}
                style={[
                  styles.intentChip,
                  compatSignB === z.sign && { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
                ]}
                onPress={() => setCompatSignB(z.sign)}
              >
                <Text
                  style={[
                    styles.intentText,
                    compatSignB === z.sign && { color: '#0b0a1f', fontFamily: 'PoppinsBold' },
                  ]}
                >
                  {z.sign}
                </Text>
              </Pressable>
            ))}
          </View>
          {compatSignA && compatSignB && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{compatSignA} + {compatSignB}</Text>
              <Text style={styles.sectionText}>
                Score: {compatibilityScore(compatSignA, compatSignB)} / 100 · Snapshot of harmony and energy.
              </Text>
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
  kicker: { color: '#c1c4ff', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  headline: { color: '#fff', fontSize: 22, fontFamily: 'PoppinsBold', marginBottom: 6 },
  subhead: { color: '#d8daf4', fontSize: 14, lineHeight: 20 },
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#0d0c1f',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: { color: '#fff', fontSize: 18, fontFamily: 'PoppinsBold' },
  cardHint: { color: '#b6b7d6', fontSize: 13, fontFamily: 'Poppins', marginTop: 4 },
  input: {
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
  error: { color: '#fbd38d', fontFamily: 'Poppins', fontSize: 12, marginTop: 6 },
  signRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  signLabel: { color: '#b6b7d6', fontFamily: 'Poppins', fontSize: 12 },
  signValue: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 16 },
  primaryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryText: { color: '#0b0a1f', fontFamily: 'PoppinsBold' },
  section: { marginTop: 10 },
  sectionLabel: { color: '#c1c4ff', fontFamily: 'PoppinsBold', fontSize: 14 },
  sectionText: { color: '#d8daf4', fontFamily: 'Poppins', fontSize: 13, marginTop: 4, lineHeight: 19 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 8 },
});

// Basic compatibility scoring matrix (fun-only)
const compatMatrix: Record<string, Record<string, number>> = {
  Aries: { Leo: 88, Sagittarius: 85, Gemini: 78, Libra: 72 },
  Taurus: { Virgo: 86, Capricorn: 84, Cancer: 78, Scorpio: 72 },
  Gemini: { Libra: 86, Aquarius: 84, Aries: 78, Sagittarius: 70 },
  Cancer: { Scorpio: 86, Pisces: 84, Taurus: 78, Capricorn: 70 },
  Leo: { Aries: 88, Sagittarius: 85, Libra: 78, Aquarius: 72 },
  Virgo: { Taurus: 86, Capricorn: 84, Cancer: 76, Pisces: 70 },
  Libra: { Gemini: 86, Aquarius: 84, Leo: 78, Aries: 72 },
  Scorpio: { Cancer: 86, Pisces: 84, Virgo: 76, Taurus: 72 },
  Sagittarius: { Aries: 85, Leo: 84, Libra: 76, Gemini: 70 },
  Capricorn: { Taurus: 84, Virgo: 82, Pisces: 74, Cancer: 70 },
  Aquarius: { Gemini: 84, Libra: 82, Sagittarius: 76, Leo: 72 },
  Pisces: { Cancer: 84, Scorpio: 82, Capricorn: 74, Virgo: 70 },
};

function compatibilityScore(a: string, b: string): number {
  if (compatMatrix[a] && compatMatrix[a][b] !== undefined) return compatMatrix[a][b];
  if (compatMatrix[b] && compatMatrix[b][a] !== undefined) return compatMatrix[b][a];
  return 70; // default neutral score
}
