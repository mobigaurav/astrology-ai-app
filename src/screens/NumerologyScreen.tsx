import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const lettersValue: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

function reduceNumber(num: number): number {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = num
      .toString()
      .split('')
      .map((d) => parseInt(d, 10))
      .reduce((a, b) => a + b, 0);
  }
  return num;
}

function computeLifePath(dob: string): number | null {
  const parts = dob.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!/^\d{4}$/.test(y) || !/^\d{2}$/.test(m) || !/^\d{2}$/.test(d)) return null;
  const sum = y.split('').concat(m.split(''), d.split('')).reduce((acc, val) => acc + parseInt(val, 10), 0);
  return reduceNumber(sum);
}

function computeExpression(name: string): number | null {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (!letters) return null;
  const total = letters.split('').reduce((acc, ch) => acc + (lettersValue[ch] || 0), 0);
  return reduceNumber(total);
}

function computeSoulUrge(name: string): number | null {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
  const vowels = letters.match(/[AEIOUY]/g);
  if (!vowels || vowels.length === 0) return null;
  const total = vowels.reduce((acc, ch) => acc + (lettersValue[ch] || 0), 0);
  return reduceNumber(total);
}

const interpretations: Record<number, string> = {
  1: 'Independent, pioneering, leadership energy.',
  2: 'Diplomatic, cooperative, harmony-seeking.',
  3: 'Creative, expressive, optimistic.',
  4: 'Practical, organized, builder mindset.',
  5: 'Adventurous, adaptable, freedom-loving.',
  6: 'Nurturing, responsible, community-focused.',
  7: 'Analytical, introspective, spiritual seeker.',
  8: 'Ambitious, empowered, materially adept.',
  9: 'Compassionate, humanitarian, big-picture.',
  11: 'Intuitive, inspiring, visionary (master number).',
  22: 'Master builder, practical visionary (master number).',
  33: 'Compassionate teacher, uplifting service (master number).',
};

export default function NumerologyScreen() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');

  const lifePath = useMemo(() => computeLifePath(dob), [dob]);
  const expression = useMemo(() => computeExpression(name), [name]);
  const soulUrge = useMemo(() => computeSoulUrge(name), [name]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <LinearGradient colors={['#111126', '#090815']} style={styles.hero}>
          <Text style={styles.kicker}>Numerology</Text>
          <Text style={styles.headline}>Decode your numbers</Text>
          <Text style={styles.subhead}>
            Enter your name and date of birth to reveal life path, expression, and soul urge numbers.
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your details</Text>
          <Text style={styles.cardHint}>Name (full, as you use it) and birth date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor="#8b8ca7"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#8b8ca7"
            value={dob}
            onChangeText={setDob}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your numbers</Text>
          <Text style={styles.cardHint}>Tap into your core patterns and tendencies.</Text>
          <View style={styles.resultRow}>
            <View style={styles.resultPill}>
              <Text style={styles.resultLabel}>Life Path</Text>
              <Text style={styles.resultValue}>{lifePath ?? '—'}</Text>
            </View>
            <View style={styles.resultPill}>
              <Text style={styles.resultLabel}>Expression</Text>
              <Text style={styles.resultValue}>{expression ?? '—'}</Text>
            </View>
            <View style={styles.resultPill}>
              <Text style={styles.resultLabel}>Soul Urge</Text>
              <Text style={styles.resultValue}>{soulUrge ?? '—'}</Text>
            </View>
          </View>

          {lifePath && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Life Path {lifePath}</Text>
              <Text style={styles.sectionText}>{interpretations[lifePath] || 'Unique path.'}</Text>
            </View>
          )}
          {expression && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Expression {expression}</Text>
              <Text style={styles.sectionText}>{interpretations[expression] || 'Distinct expression energy.'}</Text>
            </View>
          )}
          {soulUrge && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Soul Urge {soulUrge}</Text>
              <Text style={styles.sectionText}>{interpretations[soulUrge] || 'Heart-level drive.'}</Text>
            </View>
          )}

          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>How it works</Text>
            <Text style={styles.tipText}>
              Life Path sums your birth date. Expression sums all letters (Pythagorean values). Soul Urge sums vowels. Master
              numbers (11/22/33) are kept as-is.
            </Text>
          </View>
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
  resultRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  resultPill: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  resultLabel: { color: '#b6b7d6', fontFamily: 'Poppins', fontSize: 12 },
  resultValue: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 18, marginTop: 4 },
  section: { marginTop: 10 },
  sectionLabel: { color: '#c1c4ff', fontFamily: 'PoppinsBold', fontSize: 14 },
  sectionText: { color: '#d8daf4', fontFamily: 'Poppins', fontSize: 13, marginTop: 4, lineHeight: 19 },
  tipCard: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
  },
  tipLabel: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 13 },
  tipText: { color: '#d8daf4', fontFamily: 'Poppins', fontSize: 12, marginTop: 4, lineHeight: 18 },
});
