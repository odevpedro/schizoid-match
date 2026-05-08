import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text, lineHeight: 22 },
  bodyMuted: { fontSize: 15, fontWeight: '400', color: colors.textMuted, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSubtle, letterSpacing: 0.5 },
  score: { fontSize: 24, fontWeight: '800', color: colors.primary },
});
