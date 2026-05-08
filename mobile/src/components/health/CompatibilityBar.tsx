import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface CompatibilityBarProps {
  score: number;
  showLabel?: boolean;
}

export const CompatibilityBar: React.FC<CompatibilityBarProps> = ({ score, showLabel = true }) => {
  const getColor = (s: number) => {
    if (s >= 80) return colors.primary;
    if (s >= 60) return colors.success;
    if (s >= 40) return colors.warning;
    return colors.error;
  };

  const color = getColor(score);

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.row}>
          <Text style={styles.label}>Compatibilidade</Text>
          <Text style={[styles.score, { color }]}>{score}%</Text>
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${score}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  score: { fontSize: 14, fontWeight: '700' },
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2 },
});
