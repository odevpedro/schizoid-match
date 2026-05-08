import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
}

const variantColors = {
  primary: { bg: colors.primaryDim, text: colors.primary },
  secondary: { bg: colors.secondaryDim, text: colors.secondary },
  success: { bg: 'rgba(16,185,129,0.15)', text: colors.success },
  warning: { bg: 'rgba(245,158,11,0.15)', text: colors.warning },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary' }) => {
  const c = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});
