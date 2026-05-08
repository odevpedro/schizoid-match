import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', loading, disabled, style,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === 'outline' ? styles.textOutline : null,
    variant === 'ghost' ? styles.textGhost : null,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.background} size="small" />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: { backgroundColor: colors.glass },
  danger: { backgroundColor: colors.error },
  disabled: { opacity: 0.5 },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    letterSpacing: 0.2,
  },
  textOutline: { color: colors.primary },
  textGhost: { color: colors.text },
});
