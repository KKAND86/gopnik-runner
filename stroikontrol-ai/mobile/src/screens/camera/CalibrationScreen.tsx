import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function CalibrationScreen({ route }: any) {
  const navigation = useNavigation();
  const { projectId } = route?.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Калибровка</Text>
      <Text style={styles.text}>Проект: {projectId}</Text>
      <Text style={styles.text}>Положите монету или карту на плитку и сделайте фото</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Назад</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 16, marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16 },
});
