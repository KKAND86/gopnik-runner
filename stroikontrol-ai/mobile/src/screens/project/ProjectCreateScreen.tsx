import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { projectsApi } from '@api/client';

export default function ProjectCreateScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = React.useState('');
  const [roomType, setRoomType] = React.useState('bathroom');
  const [surfaceType, setSurfaceType] = React.useState('wall');
  const [loading, setLoading] = React.useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.create({ title, room_type: roomType, surface_type: surfaceType });
      const projectId = res.data.id;
      Alert.alert('Создано', 'Проект создан. Перейти к калибровке?');
      navigation.navigate('Camera' as never, { projectId, step: 'calibration' } as never);
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.detail || 'Не удалось создать');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Новый проект</Text>
      <TextInput style={styles.input} placeholder="Название (необязательно)" value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Тип помещения</Text>
      <TextInput style={styles.input} value={roomType} onChangeText={setRoomType} />
      <Text style={styles.label}>Тип поверхности</Text>
      <TextInput style={styles.input} value={surfaceType} onChangeText={setSurfaceType} />
      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Создание...' : 'Создать проект'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
