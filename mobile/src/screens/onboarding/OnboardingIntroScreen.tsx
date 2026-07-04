import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export const OnboardingIntroScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>WM</Text>
        </View>
      </View>

      <Text style={styles.title}>Bem-vindo ao WellMatch</Text>
      <Text style={styles.subtitle}>
        O WellMatch conecta você a pessoas com rotinas compatíveis para caminhar, treinar e manter
        hábitos saudáveis — sem expor seus dados sensíveis de saúde.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('OnboardingIntent')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Começar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    padding: spacing.screen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: { marginBottom: spacing.xl, alignItems: 'center' },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280,
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: colors.background },
});
