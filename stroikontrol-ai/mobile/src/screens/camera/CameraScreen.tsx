/**
 * Camera Screen — Multi-angle capture with overlay + calibration
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRoute, useNavigation } from '@react-navigation/native';

import { projectsApi } from '@api/client';

const ANGLES = [
  { key: 'front', label: 'Фронтально' },
  { key: 'left_30', label: 'Слева 30°' },
  { key: 'right_30', label: 'Справа 30°' },
];

export function CameraScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { projectId, step } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [captured, setCaptured] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
      });

      // On-device quality checks
      const processed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 2048 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      const angle = ANGLES[currentAngleIndex].key;
      setUploading(true);

      // Upload
      const file = {
        uri: processed.uri,
        type: 'image/jpeg',
        name: `${projectId}_${angle}_${Date.now()}.jpg`,
      };

      await projectsApi.uploadPhoto(projectId, angle, file);

      const newCaptured = new Set(captured);
      newCaptured.add(angle);
      setCaptured(newCaptured);

      // Next angle or finish
      if (currentAngleIndex < ANGLES.length - 1) {
        setCurrentAngleIndex(currentAngleIndex + 1);
      } else {
        Alert.alert(
          'Съемка завершена',
          'Все 3 угла сняты. Перейти к аудиозаписи?',
          [
            { text: 'Позже', onPress: () => navigation.goBack() },
            { text: 'Да', onPress: () => navigation.navigate('AudioRecord', { projectId }) },
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось сделать снимок');
    } finally {
      setUploading(false);
    }
  }, [currentAngleIndex, captured, projectId, navigation]);

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Требуется разрешение на камеру</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Разрешить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentAngle = ANGLES[currentAngleIndex];
  const progress = `${captured.size} / ${ANGLES.length}`;

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="picture"
      >
        {/* Overlay grid for tile alignment */}
        <View style={styles.overlay}>
          <View style={styles.grid}>
            <View style={styles.gridLineH} />
            <View style={styles.gridLineH} />
            <View style={styles.gridLineV} />
            <View style={styles.gridLineV} />
          </View>
        </View>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.angleLabel}>{currentAngle.label}</Text>
          <Text style={styles.progress}>{progress}</Text>
        </View>
      </CameraView>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <View style={styles.angleDots}>
          {ANGLES.map((a, i) => (
            <View
              key={a.key}
              style={[
                styles.dot,
                i === currentAngleIndex && styles.dotActive,
                captured.has(a.key) && styles.dotDone,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.shutter, uploading && styles.shutterDisabled]}
          onPress={takePhoto}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>Удерживайте телефон ровно</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    width: '80%',
    height: '60%',
    position: 'relative',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  angleLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  progress: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  controls: {
    padding: 24,
    alignItems: 'center',
  },
  angleDots: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#2563EB',
    transform: [{ scale: 1.3 }],
  },
  dotDone: {
    backgroundColor: '#10B981',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
  },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 16,
  },
});
