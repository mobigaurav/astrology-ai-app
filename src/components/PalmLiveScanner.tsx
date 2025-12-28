import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  onClose: () => void;
  onCaptured: (uri: string) => void;
};

/**
 * Live scanner powered by react-native-vision-camera.
 * Frame processor/model hook is intentionally stubbed; plug in your on-device model here.
 */
export default function PalmLiveScanner({ onClose, onCaptured }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState('Align your palm within the frame and hold steady.');
  const [handReady, setHandReady] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Placeholder: simulate readiness after a brief stabilization period.
  useEffect(() => {
    const timer = setTimeout(() => {
      setHandReady(true);
      setStatus('Palm detected. Hold steady and capture.');
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current || !device || !handReady) {
      return;
    }
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
        qualityPrioritization: 'balanced',
        skipMetadata: true,
      });
      const uri = (photo as any)?.path || (photo as any)?.uri;
      if (uri) onCaptured(uri);
      setStatus('Captured. Processing...');
    } catch (err) {
      setStatus('Capture failed. Try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!device) {
    return (
      <SafeAreaView style={styles.fallback}>
        <Text style={styles.fallbackText}>No camera device found.</Text>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.fallback}>
        <Text style={styles.fallbackText}>Camera permission needed.</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryText}>Grant permission</Text>
        </Pressable>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#181743', '#0b0a1f']} style={styles.header}>
        <Text style={styles.kicker}>On-device Beta</Text>
        <Text style={styles.title}>Live palm scan</Text>
        <Text style={styles.subtitle}>{status}</Text>
      </LinearGradient>

      <View style={styles.cameraWrap}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          photo
        />
        <View style={styles.frame}>
          <View style={styles.frameCorner} />
          <View style={[styles.frameCorner, styles.frameCornerBR]} />
          <View style={[styles.frameCorner, styles.frameCornerTL]} />
          <View style={[styles.frameCorner, styles.frameCornerTR]} />
          <Text style={styles.frameText}>Center your palm here</Text>
          <View style={[styles.readyDot, { backgroundColor: handReady ? '#34d399' : '#f59e0b' }]} />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryText}>Close</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, (!handReady || isCapturing) && { opacity: 0.6 }]}
          disabled={!handReady || isCapturing}
          onPress={handleCapture}
        >
          {isCapturing ? <ActivityIndicator color="#0b0a1f" /> : <Text style={styles.primaryText}>{handReady ? 'Capture' : 'Hold steady'}</Text>}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Model integration pending. MediaPipe/line overlay coming soon; capture uses current analysis flow.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0a1f' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  kicker: { color: '#c1c4ff', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 20, fontFamily: 'PoppinsBold', marginTop: 4 },
  subtitle: { color: '#d8daf4', fontSize: 13, marginTop: 2, fontFamily: 'Poppins' },
  cameraWrap: { flex: 1, marginHorizontal: 12, marginBottom: 10, borderRadius: 16, overflow: 'hidden' },
  frame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameCorner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#7c3aed',
    borderLeftWidth: 3,
    borderTopWidth: 3,
    bottom: 18,
    right: 18,
  },
  frameCornerBR: { bottom: 18, right: 18, transform: [{ rotate: '0deg' }] },
  frameCornerTL: { top: 18, left: 18, transform: [{ rotate: '180deg' }] },
  frameCornerTR: { top: 18, right: 18, transform: [{ rotate: '-90deg' }] },
  frameText: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    color: '#fff',
    fontFamily: 'PoppinsBold',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
  },
  readyDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryText: { color: '#0b0a1f', fontFamily: 'PoppinsBold' },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryText: { color: '#fff', fontFamily: 'PoppinsBold' },
  footer: { paddingHorizontal: 16, paddingBottom: 16 },
  footerText: { color: '#9ea0c7', fontFamily: 'Poppins', fontSize: 12, textAlign: 'center' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0a1f', gap: 12 },
  fallbackText: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 14 },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  closeText: { color: '#fff', fontFamily: 'PoppinsBold' },
});
