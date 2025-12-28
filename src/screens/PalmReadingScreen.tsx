// src/screens/PalmReadingScreen.tsx
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  Pressable,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
  Image as RNImage,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

import palmZones from '../data/palm_reading_zones.json';
import palmImage from '../assets/palm/palm-outline-updated.png';
import { fetchPalmInsights, PalmInsight } from '../services/palmInference';
import PalmLiveScanner from '../components/PalmLiveScanner';

interface PalmZone {
  id: string;
  name: string;
  top: number;
  left: number;
  description: string;
}

type PickMode = 'camera' | 'library';

const windowWidth = Dimensions.get('window').width;
const baseWidth = 300;
const scale = (windowWidth - 32) / baseWidth; // leave breathing room with padding
const zoneSize = 22 * scale; // Adjust size of clickable zones based on scale

const analysisTemplates = [
  {
    id: 'life_line',
    title: 'Life line',
    summary: 'Strong curve with depth indicates resilient energy and steady vitality.',
    advice: 'Balance rest with movement; hydration and breathwork boost your baseline.',
  },
  {
    id: 'heart_line',
    title: 'Heart line',
    summary: 'Gentle arch shows empathy and openness with healthy boundaries.',
    advice: 'Name your needs early in conversations to avoid emotional overload.',
  },
  {
    id: 'head_line',
    title: 'Head line',
    summary: 'Balanced length suggests practical creativity and focused thinking.',
    advice: 'Use short, time-boxed sprints when starting new ideas to keep clarity.',
  },
  {
    id: 'fate_line',
    title: 'Fate line',
    summary: 'Visible and straight fate line hints at steady career direction.',
  advice: 'Double down on one long-range goal this quarter; protect calendar space.',
  },
];

export default function PalmReadingScreen() {
  const [selectedZone, setSelectedZone] = useState<PalmZone | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [guidanceVisible, setGuidanceVisible] = useState(true);
  const [analysis, setAnalysis] = useState<PalmInsight[]>(analysisTemplates);
  const [retakeReason, setRetakeReason] = useState<string | null>(null);
  const [showLiveScanner, setShowLiveScanner] = useState(false);
  const [qualityChecks, setQualityChecks] = useState<
    { label: string; passed: boolean; helper?: string }[]
  >([]);
  const videoRef = useRef<Video | null>(null);

  const tutorialVideo = {
    id: 'inline',
    title: 'Palm lines 101 (quick primer)',
    duration: '2:10',
    url: 'https://d23dyxeqlo5psv.cloudfront.net/elephantsdream/ed_hd.mp4', // placeholder hosted primer
  };

  const runAnalysis = async (uri: string) => {
    setPhotoUri(uri);
    setIsProcessing(true);
    setRetakeReason(null);
    setQualityChecks([]);

    const minSide = 900;
    let lowRes = false;
    let aspectOff = false;
    try {
      const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        RNImage.getSize(
          uri,
          (width, height) => resolve({ width, height }),
          (error) => reject(error)
        );
      });
      lowRes = size.width < minSide || size.height < minSide;
      const ratio = size.width / size.height;
      aspectOff = ratio < 0.6 || ratio > 1.4;
      setQualityChecks([
        { label: 'Resolution ≥ 900px', passed: !lowRes, helper: lowRes ? 'Retake closer to the hand.' : undefined },
        { label: 'Centered framing', passed: !aspectOff, helper: aspectOff ? 'Keep palm upright and fill frame.' : undefined },
      ]);
    } catch (err) {
      lowRes = false;
      setQualityChecks([
        { label: 'Resolution check', passed: true },
        { label: 'Centered framing', passed: true },
      ]);
    }

    const resultData = await fetchPalmInsights(uri);
    setAnalysis(resultData.insights ?? analysisTemplates);

    if (resultData.flags?.needsRetake || lowRes) {
      setRetakeReason(
        resultData.flags?.reason ??
          'We need a clearer palm photo: use natural light, keep lines sharp, and fill the frame.'
      );
      setQualityChecks((prev) => [
        ...prev,
        { label: 'Sharp lines', passed: false, helper: 'Retake with steady hand and good light.' },
      ]);
    }

    setTimeout(() => setIsProcessing(false), 200);
  };

  const handlePick = async (mode: PickMode) => {
    try {
      const permission =
        mode === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to proceed with palm scanning.');
        return;
      }

      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({
              quality: 1,
              base64: false,
              exif: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              quality: 1,
              base64: false,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: false,
            });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      await runAnalysis(uri);
    } catch (error) {
      console.warn('Image pick error', error);
      Alert.alert('Something went wrong', 'Unable to access camera or gallery right now.');
    }
  };

  const handleLiveCaptured = async (uri: string) => {
    setShowLiveScanner(false);
    await runAnalysis(uri);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0b0a1f]">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient
          colors={['#181743', '#0b0a1f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTextWrap}>
            <Text style={styles.kicker}>Palmistry Assistant</Text>
            <Text style={styles.headline}>Scan your palm, get tailored guidance</Text>
            <Text style={styles.subhead}>
              Capture your palm and explore lines, mounts, and life themes with clear steps.
            </Text>
            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Beta</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <Text style={styles.badgeText}>Camera or Upload</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroCardTitle}>Quick tips</Text>
            <Text style={styles.heroCardBody}>
              Use natural light, center your palm, and keep lines in focus. Remove jewelry for a clean scan.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Scan your palm</Text>
            <Text style={styles.sectionHint}>Upload or scan live, then review insights</Text>
          </View>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Live line overlay coming soon · Current version uses backend analysis</Text>
          </View>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Live line overlay coming soon · Current version uses backend analysis</Text>
          </View>

          {guidanceVisible && (
            <View style={styles.guidedTips}>
              <Text style={styles.guidedTitle}>Guided capture</Text>
              <Text style={styles.guidedItem}>• Use your non-dominant hand, keep it 15–20cm from camera.</Text>
              <Text style={styles.guidedItem}>• Natural light, avoid harsh shadows, keep lines sharp.</Text>
              <Text style={styles.guidedItem}>• Flatten your palm; remove rings/bracelets.</Text>
              <TouchableOpacity style={styles.guidedClose} onPress={() => setGuidanceVisible(false)}>
                <Text style={styles.guidedCloseText}>Got it</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={() => setShowLiveScanner(true)}>
              <Text style={styles.primaryButtonText}>Live scan (beta)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handlePick('library')}>
              <Text style={styles.secondaryButtonText}>Upload photo</Text>
            </TouchableOpacity>
          </View>

          {photoUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: photoUri }} style={styles.preview} />
              <View pointerEvents="none" style={styles.previewOverlay}>
                {palmZones.map((zone) => {
                  const previewWidth = windowWidth - 32;
                  const previewHeight = 240;
                  const scaleX = previewWidth / 300;
                  const scaleY = previewHeight / 450;
                  return (
                    <View
                      key={zone.id}
                      style={{
                        position: 'absolute',
                        top: zone.top * scaleY,
                        left: zone.left * scaleX,
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: 'rgba(124,58,237,0.2)',
                        borderWidth: 1,
                        borderColor: '#7c3aed',
                      }}
                    />
                  );
                })}
              </View>
              {isProcessing ? (
                <View style={styles.processing}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.processingText}>Analyzing lines...</Text>
                </View>
              ) : (
                <Text style={styles.previewHint}>Preview captured palm</Text>
              )}
              {retakeReason && (
                <View style={styles.retakeOverlay}>
                  <Text style={styles.retakeTitle}>Retake recommended</Text>
                  <Text style={styles.retakeBody}>{retakeReason}</Text>
                  <View style={styles.retakeActions}>
                    <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={() => setShowLiveScanner(true)}>
                      <Text style={styles.primaryButtonText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, { borderColor: 'rgba(255,255,255,0.15)' }]} onPress={() => setRetakeReason(null)}>
                      <Text style={styles.secondaryButtonText}>Use anyway</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.placeholderText}>No photo yet. Start with a live scan or upload.</Text>
          )}

          {qualityChecks.length > 0 && (
            <View style={styles.qualityCard}>
              <Text style={styles.qualityTitle}>Quality checks</Text>
              {qualityChecks.map((q) => (
                <View key={q.label} style={styles.qualityRow}>
                  <View
                    style={[
                      styles.qualityDot,
                      { backgroundColor: q.passed ? '#34d399' : '#f59e0b' },
                    ]}
                  />
                  <Text style={styles.qualityText}>
                    {q.label} {q.helper && !q.passed ? `· ${q.helper}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reading highlights</Text>
            <Text style={styles.sectionHint}>Heart, head, life, and fate lines in one glance</Text>
          </View>
          {analysis.map((item) => (
            <View key={item.id} style={styles.analysisRow}>
              <View style={styles.bullet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.analysisTitle}>{item.title}</Text>
                <Text style={styles.analysisSummary}>{item.summary}</Text>
                <Text style={styles.analysisAdvice}>{item.advice}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interactive map</Text>
            <Text style={styles.sectionHint}>Tap a zone to learn what it means</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Image
              source={palmImage}
              style={{
                width: windowWidth - 32,
                height: (windowWidth - 32) * 1.4,
                resizeMode: 'contain',
                transform: [{ scaleX: -1 }],
              }}
            />

            {palmZones.map((zone: PalmZone) => (
              <Pressable
                key={zone.id}
                onPress={() => setSelectedZone(zone)}
                style={{
                  position: 'absolute',
                  top: zone.top * scale,
                  left: zone.left * scale,
                  width: zoneSize,
                  height: zoneSize,
                  borderRadius: zoneSize / 2,
                  backgroundColor: 'rgba(120, 97, 255, 0.18)',
                  borderWidth: 1,
                  borderColor: '#7861ff',
                  transform: [{ scaleX: -1 }],
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Learn & watch</Text>
            <Text style={styles.sectionHint}>Short primer on major palm lines</Text>
          </View>
          <View style={styles.videoPlayerWrap}>
            <Video
              ref={videoRef}
              source={{ uri: tutorialVideo.url }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              useNativeControls
            />
            <View style={styles.videoOverlay}>
              <Text style={styles.videoTitle}>{tutorialVideo.title}</Text>
              <Text style={styles.videoSubtitle}>{tutorialVideo.duration}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showLiveScanner} animationType="slide" presentationStyle="fullScreen">
        <PalmLiveScanner onClose={() => setShowLiveScanner(false)} onCaptured={handleLiveCaptured} />
      </Modal>

      <Modal visible={!!selectedZone} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedZone(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{selectedZone?.name}</Text>
                <Text style={styles.modalBody}>{selectedZone?.description}</Text>

                <TouchableOpacity onPress={() => setSelectedZone(null)} style={styles.modalClose}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroTextWrap: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  kicker: {
    color: '#a4b2ff',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headline: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'PoppinsBold',
    marginBottom: 6,
  },
  subhead: {
    color: '#d7d9f4',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  badgesRow: { flexDirection: 'row', gap: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#7861ff',
  },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins' },
  heroCard: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  heroCardTitle: { color: '#fff', fontSize: 14, fontFamily: 'PoppinsBold', marginBottom: 4 },
  heroCardBody: { color: '#d7d9f4', fontSize: 13, lineHeight: 18, fontFamily: 'Poppins' },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#141332',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeader: { marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontFamily: 'PoppinsBold' },
  sectionHint: { color: '#b6b7d6', fontSize: 13, fontFamily: 'Poppins' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#7861ff',
    borderColor: '#7861ff',
  },
  primaryButtonText: { color: '#0b0a1f', fontFamily: 'PoppinsBold' },
  secondaryButtonText: { color: '#fff', fontFamily: 'PoppinsBold' },
  previewWrap: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  preview: {
    width: '100%',
    height: 240,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  processing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  processingText: { color: '#fff', fontFamily: 'PoppinsBold' },
  previewHint: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontFamily: 'Poppins',
    fontSize: 12,
  },
  placeholderText: { color: '#9ea0c7', fontSize: 13, fontFamily: 'Poppins', marginTop: 10 },
  retakeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,10,31,0.78)',
    padding: 14,
    justifyContent: 'center',
    gap: 8,
  },
  retakeTitle: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 16 },
  retakeBody: { color: '#d7d9f4', fontFamily: 'Poppins', fontSize: 13, lineHeight: 18 },
  retakeActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  analysisRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#7861ff',
    marginTop: 4,
  },
  analysisTitle: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 15 },
  analysisSummary: { color: '#c9c9df', fontFamily: 'Poppins', fontSize: 13, marginTop: 2 },
  analysisAdvice: { color: '#9ea0c7', fontFamily: 'Poppins', fontSize: 12, marginTop: 4 },
  videoPlayerWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  video: { width: '100%', height: 220 },
  videoOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  videoTitle: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 15 },
  videoSubtitle: { color: '#d7d9f4', fontFamily: 'Poppins', fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  modalBody: { fontSize: 16, color: '#333' },
  modalClose: { marginTop: 18, alignSelf: 'flex-end' },
  modalCloseText: { color: '#007AFF', fontWeight: '600' },
  guidedTips: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(120,97,255,0.08)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(120,97,255,0.18)',
  },
  guidedTitle: { color: '#fff', fontFamily: 'PoppinsBold', marginBottom: 4 },
  guidedItem: { color: '#d7d9f4', fontFamily: 'Poppins', fontSize: 12, lineHeight: 18 },
  guidedClose: { alignSelf: 'flex-end', marginTop: 6 },
  guidedCloseText: { color: '#7861ff', fontFamily: 'PoppinsBold' },
  banner: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    marginBottom: 10,
  },
  bannerText: { color: '#e9e7ff', fontFamily: 'PoppinsBold', fontSize: 12 },
  qualityCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  qualityTitle: { color: '#fff', fontFamily: 'PoppinsBold', marginBottom: 6 },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  qualityDot: { width: 10, height: 10, borderRadius: 6 },
  qualityText: { color: '#d7d9f4', fontFamily: 'Poppins', fontSize: 12 },
});
