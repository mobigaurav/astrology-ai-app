import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image as RNImage,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';

import faceZones from '../data/face_reading_zones_for_updated_image.json';
import { fetchFaceInsights, FaceInsight } from '../services/faceInference';

interface Zone {
  id: number;
  name: string;
  top: number;
  left: number;
  description: string;
}

const baseImageWidth = 300;
const baseImageHeight = 390;

const analysisTemplates: FaceInsight[] = [
  {
    id: 'forehead',
    title: 'Forehead',
    summary: 'Broad, smooth forehead shows strategic thinking and future orientation.',
    advice: 'Plan in weekly horizons; write a 3-bullet intent each morning.',
  },
  {
    id: 'eyes',
    title: 'Eyes',
    summary: 'Even gaze suggests clear perception and empathy.',
    advice: 'Leverage active listening; pause before responding to complex topics.',
  },
  {
    id: 'nose',
    title: 'Nose',
    summary: 'Centered bridge indicates steady ambition and practical drive.',
    advice: 'Pick one career lever to push this month; track wins weekly.',
  },
  {
    id: 'mouth',
    title: 'Mouth',
    summary: 'Balanced lips hint at honest expression and relational warmth.',
    advice: 'State intentions plainly; summarize conversations with next steps.',
  },
];

export default function FaceReadingScreen() {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FaceInsight[]>(analysisTemplates);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retakeReason, setRetakeReason] = useState<string | null>(null);
  const [overlayScale, setOverlayScale] = useState({ x: 1, y: 1, offsetX: 0, offsetY: 0 });
  const videoRef = useRef<Video | null>(null);

  const tutorialVideo = {
    url: 'https://d23dyxeqlo5psv.cloudfront.net/elephantsdream/ed_hd.mp4', // hosted placeholder
    duration: '2:20',
    title: 'Chinese face reading primer',
  };

  const zones = useMemo(() => faceZones, []);

  const onImageLayout = (event: any) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    setOverlayScale({
      x: width / baseImageWidth,
      y: height / baseImageHeight,
      offsetX: x,
      offsetY: y,
    });
  };

  const handlePick = async (mode: 'camera' | 'library') => {
    try {
      const permission =
        mode === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow camera or photos to scan your face.');
        return;
      }
      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({
              quality: 1,
              base64: false,
              exif: false,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      setPhotoUri(uri);
      setIsProcessing(true);
      setRetakeReason(null);

      let lowRes = false;
      try {
        const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          RNImage.getSize(
            uri,
            (width, height) => resolve({ width, height }),
            (error) => reject(error)
          );
        });
        lowRes = size.width < 900 || size.height < 900;
      } catch (err) {
        lowRes = false;
      }

      const resultData = await fetchFaceInsights(uri);
      setAnalysis(resultData.insights ?? analysisTemplates);

      if (resultData.flags?.needsRetake || lowRes) {
        setRetakeReason(
          resultData.flags?.reason ??
            'We need a clearer face photo: keep the face centered, lit evenly, and avoid motion.'
        );
      }

      setTimeout(() => setIsProcessing(false), 250);
    } catch (err) {
      console.warn('Face pick error', err);
      Alert.alert('Something went wrong', 'Unable to access camera or gallery right now.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient colors={['#111126', '#090815']} style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.kicker}>Mian Xiang Guide</Text>
            <Text style={styles.headline}>Scan your face. Decode your path.</Text>
            <Text style={styles.subhead}>
              Capture a clear portrait. We map zones from Chinese face reading to deliver tailored insights.
            </Text>
            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Camera or Upload</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <Text style={styles.badgeText}>Guided</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Scan your face</Text>
            <Text style={styles.sectionHint}>Use natural light and center your face</Text>
          </View>
          <View style={styles.guidedTips}>
            <Text style={styles.guidedTitle}>Capture guidance</Text>
            <Text style={styles.guidedItem}>• Face the light; avoid backlighting and harsh shadows.</Text>
            <Text style={styles.guidedItem}>• Remove glasses for a clean scan; keep hair off the face.</Text>
            <Text style={styles.guidedItem}>• Keep the frame steady; align eyes near the top third.</Text>
          </View>
          <View style={styles.actionsRow}>
            <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={() => handlePick('camera')}>
              <Text style={styles.primaryText}>Live scan</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => handlePick('library')}>
              <Text style={styles.secondaryText}>Upload photo</Text>
            </Pressable>
          </View>

          {photoUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: photoUri }} style={styles.preview} />
              {isProcessing ? (
                <View style={styles.processing}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.processingText}>Analyzing zones...</Text>
                </View>
              ) : (
                <Text style={styles.previewHint}>Portrait preview</Text>
              )}
              {retakeReason && (
                <View style={styles.retakeOverlay}>
                  <Text style={styles.retakeTitle}>Retake recommended</Text>
                  <Text style={styles.retakeBody}>{retakeReason}</Text>
                  <View style={styles.retakeActions}>
                    <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={() => handlePick('camera')}>
                      <Text style={styles.primaryText}>Retake</Text>
                    </Pressable>
                    <Pressable style={[styles.actionButton, { borderColor: 'rgba(255,255,255,0.18)' }]} onPress={() => setRetakeReason(null)}>
                      <Text style={styles.secondaryText}>Use anyway</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.placeholderText}>No portrait yet. Start with a live scan or upload.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reading highlights</Text>
            <Text style={styles.sectionHint}>Core zones with fast guidance</Text>
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
              source={require('../assets/face/face-outline-updated.png')}
              onLayout={onImageLayout}
              style={{
                width: Dimensions.get('window').width - 32,
                height: (Dimensions.get('window').width - 32) * 1.3,
                resizeMode: 'contain',
              }}
            />
            {zones.map((zone) => (
              <Pressable
                key={zone.id}
                onPress={() => setSelectedZone(zone)}
                style={{
                  position: 'absolute',
                  top: overlayScale.offsetY + zone.top * overlayScale.y,
                  left: overlayScale.offsetX + zone.left * overlayScale.x,
                  width: 22,
                  height: 22,
                  borderRadius: 12,
                  backgroundColor: 'rgba(124, 58, 237, 0.18)',
                  borderWidth: 1,
                  borderColor: '#7c3aed',
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Watch: face reading primer</Text>
            <Text style={styles.sectionHint}>Short explainer with key zones</Text>
          </View>
          <View style={styles.videoWrap}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090815' },
  hero: { paddingHorizontal: 16, paddingVertical: 18 },
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
  headline: { color: '#fff', fontSize: 22, fontFamily: 'PoppinsBold', marginBottom: 6 },
  subhead: { color: '#d8daf4', fontSize: 14, lineHeight: 20 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
  },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'PoppinsBold' },
  sectionCard: {
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
  guidedTips: {
    marginTop: 6,
    marginBottom: 10,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.18)',
  },
  guidedTitle: { color: '#fff', fontFamily: 'PoppinsBold', marginBottom: 4 },
  guidedItem: { color: '#d7d9f4', fontFamily: 'Poppins', fontSize: 12, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  primaryText: { color: '#0b0a1f', fontFamily: 'PoppinsBold' },
  secondaryText: { color: '#fff', fontFamily: 'PoppinsBold' },
  previewWrap: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  preview: { width: '100%', height: 260 },
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
    backgroundColor: '#7c3aed',
    marginTop: 4,
  },
  analysisTitle: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 15 },
  analysisSummary: { color: '#c9c9df', fontFamily: 'Poppins', fontSize: 13, marginTop: 2 },
  analysisAdvice: { color: '#9ea0c7', fontFamily: 'Poppins', fontSize: 12, marginTop: 4 },
  videoWrap: {
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
});
