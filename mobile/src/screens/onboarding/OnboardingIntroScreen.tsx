import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MotionInfoPanel, MotionOnboardingScreen } from '../../components/onboarding/MotionOnboarding';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const OnboardingIntroScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <MotionOnboardingScreen
      centered
      icon="WM"
      badge="Privacy-first"
      title="Bem-vindo ao WellMatch"
      subtitle="Encontre pessoas com rotinas compatíveis para caminhar, treinar e manter hábitos saudáveis sem expor seus dados sensíveis."
      footer={
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('OnboardingIntent')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Começar</Text>
      </TouchableOpacity>
      }
    >
      <View style={styles.highlights}>
        <MotionInfoPanel tone="success">
          O perfil público usa categorias seguras: objetivos, disponibilidade e bandas de rotina.
        </MotionInfoPanel>
        <View style={styles.promiseRow}>
          <View style={styles.promiseItem}>
            <Text style={styles.promiseValue}>0</Text>
            <Text style={styles.promiseLabel}>dados brutos expostos</Text>
          </View>
          <View style={styles.promiseItem}>
            <Text style={styles.promiseValue}>7</Text>
            <Text style={styles.promiseLabel}>passos rápidos</Text>
          </View>
        </View>
      </View>
    </MotionOnboardingScreen>
  );
};

const styles = StyleSheet.create({
  highlights: { width: '100%', maxWidth: 420 },
  promiseRow: { flexDirection: 'row', gap: spacing.sm },
  promiseItem: {
    flex: 1,
    minHeight: 86,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    justifyContent: 'center',
  },
  promiseValue: { color: colors.primary, fontSize: 26, fontWeight: '800', marginBottom: 2 },
  promiseLabel: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: colors.background },
});
