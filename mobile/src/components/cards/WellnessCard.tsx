import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder, useWindowDimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { MatchCandidate } from '../../types/match.types';
import { CompatibilityBar } from '../health/CompatibilityBar';
import { WellnessBadges } from '../health/WellnessBadges';

const INTENTION_LABELS: Record<string, string> = {
  friendship: 'Amizade',
  walking_partner: 'Caminhada',
  training_partner: 'Treino',
  habit_accountability: 'Rotina',
  social_connection: 'Social',
  romantic_optional: 'Flexível',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

interface WellnessCardProps {
  profile: MatchCandidate;
  onLike: () => void;
  onDislike: () => void;
  isTop: boolean;
}

export const WellnessCard: React.FC<WellnessCardProps> = ({
  profile, onLike, onDislike, isTop,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const swipeThreshold = screenWidth * 0.35;
  const position = useRef(new Animated.ValueXY()).current;
  const screenWidthRef = useRef(screenWidth);
  screenWidthRef.current = screenWidth;

  const rotate = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, swipeThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-swipeThreshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        const w = screenWidthRef.current;
        if (gesture.dx > w * 0.35) {
          Animated.timing(position, {
            toValue: { x: w + 100, y: gesture.dy },
            duration: 250,
            useNativeDriver: true,
          }).start(onLike);
        } else if (gesture.dx < -w * 0.35) {
          Animated.timing(position, {
            toValue: { x: -w - 100, y: gesture.dy },
            duration: 250,
            useNativeDriver: true,
          }).start(onDislike);
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 4,
          }).start();
        }
      },
    }),
  ).current;

  const chronotypeIcon = profile.chronotypeBand === 'morning' || profile.chronotypeBand === 'early' ? '☀' : '🌙';

  const metaParts: string[] = [];
  if (profile.ageRange) metaParts.push(profile.ageRange);
  if (profile.approximateRegion) metaParts.push(profile.approximateRegion);
  if (profile.mainIntention && INTENTION_LABELS[profile.mainIntention]) metaParts.push(INTENTION_LABELS[profile.mainIntention]);

  return (
    <Animated.View
      style={[
        styles.card,
        { width: screenWidth - spacing.screen * 2 },
        isTop && {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        },
      ]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      {isTop && (
        <>
          <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
            <Text style={styles.stampText}>MATCH</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
            <Text style={[styles.stampText, styles.nopeText]}>PASSA</Text>
          </Animated.View>
        </>
      )}

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.displayName?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{profile.displayName || 'Usuário'}</Text>
          <Text style={styles.meta}>{metaParts.join(' · ')}</Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            Confiança: {CONFIDENCE_LABELS[profile.compatibility.confidence] || profile.compatibility.confidence}
          </Text>
        </View>
        {profile.source && (
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>{profile.source === 'manual' ? 'Manual' : 'Misto'}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <CompatibilityBar score={profile.compatibility.total} />
      </View>

      <View style={styles.section}>
        <WellnessBadges badges={profile.publicBadges} goals={profile.wellnessGoals} maxDisplay={4} />
      </View>

      {profile.compatibility.reasons.length > 0 && (
        <View style={styles.summary}>
          {profile.compatibility.reasons.map((r, i) => (
            <Text key={i} style={styles.summaryText}>• {r}</Text>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  stamp: {
    position: 'absolute',
    top: 24,
    zIndex: 10,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  likeStamp: { left: 20, borderColor: colors.primary, transform: [{ rotate: '-20deg' }] },
  nopeStamp: { right: 20, borderColor: colors.error, transform: [{ rotate: '20deg' }] },
  stampText: { fontSize: 24, fontWeight: '900', color: colors.primary, letterSpacing: 2 },
  nopeText: { color: colors.error },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: colors.primary },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  confidenceBadge: {
    backgroundColor: colors.primaryDim,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confidenceText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  sourceBadge: {
    backgroundColor: colors.glass,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  section: { marginBottom: spacing.md },
  summary: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryText: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
});
