import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({ label, error, containerStyle, ...props }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, focused && styles.focused, error && styles.error]}
        placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSubtle,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  input: {
    height: 52,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focused: { borderColor: colors.primary },
  error: { borderColor: colors.error },
  errorText: { fontSize: 12, color: colors.error, marginTop: 4 },
});
