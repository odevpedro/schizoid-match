import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface MotionOnboardingScreenProps {
  step?: number;
  total?: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export const MotionOnboardingScreen: React.FC<MotionOnboardingScreenProps> = ({
  step,
  total = 7,
  eyebrow,
  title,
  subtitle,
  badge,
  icon,
  children,
  footer,
  centered,
  contentStyle,
}) => {
  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [entrance, pulse]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <View style={styles.root}>
      <View style={styles.backdrop}>
        <View style={styles.backdropBandTop} />
        <View style={styles.backdropBandBottom} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          centered && styles.contentCentered,
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {step && (
          <View style={styles.progressWrap}>
            <Text style={styles.stepText}>Passo {step} de {total}</Text>
            <View style={styles.progressTrack}>
              {Array.from({ length: total }).map((_, index) => {
                const current = index + 1;
                return (
                  <View
                    key={current}
                    style={[
                      styles.progressSegment,
                      current <= step && styles.progressSegmentActive,
                      current === step && styles.progressSegmentCurrent,
                    ]}
                  />
                );
              })}
            </View>
          </View>
        )}

        <Animated.View
          style={[
            styles.hero,
            { opacity: entrance, transform: [{ translateY }] },
            centered && styles.heroCentered,
          ]}
        >
          {icon && (
            <Animated.View style={[styles.iconShell, { transform: [{ scale: pulseScale }] }]}>
              <Text style={styles.iconText}>{icon}</Text>
            </Animated.View>
          )}
          {badge && (
            <View style={[styles.badge, centered && styles.badgeCentered]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={[styles.title, centered && styles.titleCentered]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, centered && styles.subtitleCentered]}>
              {subtitle}
            </Text>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.body,
            { opacity: entrance, transform: [{ translateY }] },
          ]}
        >
          {children}
        </Animated.View>

        {footer && (
          <Animated.View
            style={[
              styles.footer,
              { opacity: entrance, transform: [{ translateY }] },
            ]}
          >
            {footer}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

interface MotionOptionCardProps {
  title: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  marker?: 'radio' | 'checkbox' | 'none';
  delay?: number;
}

export const MotionOptionCard: React.FC<MotionOptionCardProps> = ({
  title,
  description,
  selected,
  onPress,
  marker = 'radio',
  delay = 0,
}) => {
  const entrance = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, entrance]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [{ translateY }, { scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          Animated.timing(press, {
            toValue: 1,
            duration: 90,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.timing(press, {
            toValue: 0,
            duration: 140,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }}
        style={[styles.optionCard, selected && styles.optionCardSelected]}
      >
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
            {title}
          </Text>
          {description && <Text style={styles.optionDescription}>{description}</Text>}
        </View>

        {marker !== 'none' && (
          <View
            style={[
              marker === 'checkbox' ? styles.checkbox : styles.radio,
              selected && styles.markerSelected,
            ]}
          >
            {selected && <Text style={styles.markerText}>✓</Text>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

interface MotionChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export const MotionChip: React.FC<MotionChipProps> = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      selected && styles.chipSelected,
      pressed && styles.chipPressed,
    ]}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </Pressable>
);

export const MotionInfoPanel: React.FC<{ children: ReactNode; tone?: 'info' | 'success' }> = ({
  children,
  tone = 'info',
}) => (
  <View style={[styles.infoPanel, tone === 'success' && styles.infoPanelSuccess]}>
    <Text style={styles.infoText}>{children}</Text>
  </View>
);

export function useInlineError(error: unknown, fallback: string): string {
  return useMemo(() => {
    const message = (error as any)?.response?.data?.message;
    if (Array.isArray(message)) return message.join('\n');
    return message ?? fallback;
  }, [error, fallback]);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backdropBandTop: {
    position: 'absolute',
    top: -80,
    left: -30,
    right: -30,
    height: 220,
    backgroundColor: 'rgba(0, 212, 170, 0.045)',
    transform: [{ rotate: '-8deg' }],
  },
  backdropBandBottom: {
    position: 'absolute',
    bottom: -110,
    left: -40,
    right: -40,
    height: 260,
    backgroundColor: 'rgba(59, 130, 246, 0.035)',
    transform: [{ rotate: '7deg' }],
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.screen,
    paddingTop: 50,
    paddingBottom: 36,
  },
  contentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWrap: {
    marginBottom: spacing.xl,
  },
  stepText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glassHighlight,
  },
  progressSegmentActive: {
    backgroundColor: 'rgba(0, 212, 170, 0.45)',
  },
  progressSegmentCurrent: {
    backgroundColor: colors.primary,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  heroCentered: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconShell: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  iconText: {
    fontSize: 34,
    color: colors.background,
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.22)',
    marginBottom: spacing.md,
  },
  badgeCentered: {
    alignSelf: 'center',
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  titleCentered: {
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  subtitleCentered: {
    textAlign: 'center',
    maxWidth: 420,
  },
  body: {
    width: '100%',
  },
  footer: {
    width: '100%',
    marginTop: spacing.lg,
  },
  optionCard: {
    minHeight: 68,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  optionContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  optionDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  markerText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  chipPressed: {
    opacity: 0.78,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.primary,
  },
  infoPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryDim,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoPanelSuccess: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  infoText: {
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 20,
  },
});
