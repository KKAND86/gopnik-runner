import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@store/authStore';

export function ProfileScreen() {
  const { logout, user } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Профиль</Text>
      <Text style={styles.text}>Тариф: {user?.tariff || 'FREE'}</Text>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Выйти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: '#FF3B30', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16 },
});
