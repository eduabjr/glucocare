import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatsCard({ title, value, unit, color = '#2563eb' }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>
        {value} {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 14, color: '#555', marginBottom: 6 },
  value: { fontSize: 20, fontWeight: '700' },
});
