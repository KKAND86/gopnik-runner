/**
 * Audio Recording Screen — 3s background + 9 tap grid (3x3)
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
import { Audio } from 'expo-av';
import { useRoute, useNavigation } from '@react-navigation/native';

import { projectsApi } from '@api/client';

const GRID_SIZE = 3;

export function AudioRecordScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { projectId } = route.params;

  const [phase, setPhase] = useState<'background' | 'tapping' | 'done'>('background');
  const [tapIndex, setTapIndex] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uploading, setUploading] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Требуется разрешение на микрофон');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecording(recording);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось начать запись');
    }
  }, []);

  const stopAndUpload = useCallback(async (sampleType: string, gridX?: number, gridY?: number) => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setRecording(null);

      if (!uri) return;

      setUploading(true);
      const file = {
        uri,
        type: 'audio/m4a',
        name: `${projectId}_${sampleType}_${Date.now()}.m4a`,
      };

      await projectsApi.uploadAudio(projectId, sampleType, file, gridX, gridY);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось загрузить аудио');
    } finally {
      setUploading(false);
    }
  }, [projectId]);

  const handleBackgroundDone = useCallback(async () => {
    await stopAndUpload('background');
    setPhase('tapping');
  }, [stopAndUpload]);

  const handleTap = useCallback(async () => {
    if (tapIndex >= GRID_SIZE * GRID_SIZE) return;

    const gx = tapIndex % GRID_SIZE;
    const gy = Math.floor(tapIndex / GRID_SIZE);

    await startRecording();

    // Auto-stop after tap recording (simulate tap duration)
    setTimeout(async () => {
      await stopAndUpload('tap_grid', gx, gy);

      if (tapIndex + 1 >= GRID_SIZE * GRID_SIZE) {
        setPhase('done');
        Alert.alert(
          'Готово',
          'Аудиозаписи загружены. Запустить анализ?',
          [
            { text: 'Позже', onPress: () => navigation.goBack() },
            { text: 'Анализ', onPress: () => navigation.navigate('Analysis', { projectId }) },
          ]
        );
      } else {
        setTapIndex(tapIndex + 1);
      }
    }, 500);
  }, [tapIndex, startRecording, stopAndUpload, projectId, navigation]);

  return (
    <View style={styles.container}>
      {phase === 'background' && (
        <View style={styles.phase}>
          <Text style={styles.title}>Фоновый шум</Text>
          <Text style={styles.desc}>
            Запишите 3 секунды тишины. Не стучите по плитке.
          </Text>
          <TouchableOpacity
            style={[styles.recordButton, recording && styles.recordingActive]}
            onPress={recording ? handleBackgroundDone : startRecording}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.recordButtonText}>
                {recording ? 'Завершить (3 сек)' : 'Начать запись'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {phase === 'tapping' && (
        <View style={styles.phase}>
          <Text style={styles.title}>Простукивание</Text>
          <Text style={styles.desc}>
            Постучите в центр ячейки сетки 3×3.{'\n'}
            Ячейка {tapIndex + 1} из {GRID_SIZE * GRID_SIZE}
          </Text>

          <View style={styles.grid}>
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const gx = i % GRID_SIZE;
              const gy = Math.floor(i / GRID_SIZE);
              const isCurrent = i === tapIndex;
              const isDone = i < tapIndex;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.cell,
                    isCurrent && styles.cellCurrent,
                    isDone && styles.cellDone,
                  ]}
                  onPress={isCurrent ? handleTap : undefined}
                  disabled={!isCurrent || uploading}
                >
                  <Text style={styles.cellText}>
                    {isDone ? '✓' : `${gy + 1},${gx + 1}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {uploading && <ActivityIndicator style={styles.loader} color="#2563EB" />}
        </View>
      )}

      {phase === 'done' && (
        <View style={styles.phase}>
          <Text style={styles.title}>✓ Все записи загружены</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Analysis', { projectId })}
          >
            <Text style={styles.buttonText}>Запустить анализ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    padding: 24,
  },
  phase: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingActive: {
    backgroundColor: '#DC2626',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: 8,
    justifyContent: 'center',
  },
  cell: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellCurrent: {
    backgroundColor: '#2563EB',
  },
  cellDone: {
    backgroundColor: '#10B981',
  },
  cellText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  loader: {
    marginTop: 24,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
