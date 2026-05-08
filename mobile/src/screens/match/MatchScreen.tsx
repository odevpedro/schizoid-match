import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions,
  Alert, Modal,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { WellnessCard } from '../../components/cards/WellnessCard';
import { matchingService } from '../../services/matching.service';
import { useMatchStore } from '../../store/match.slice';

export const MatchScreen: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { candidates, setCandidates, removeTopCandidate } = useMatchStore();
  const [loading, setLoading] = useState(false);
  const [matchModal, setMatchModal] = useState(false);
  const [matchedName, setMatchedName] = useState('');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const data = await matchingService.getCandidates();
      setCandidates(data);
    } catch {
      Alert.alert('Erro ao carregar candidatos');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'like' | 'dislike') => {
    const top = candidates[0];
    if (!top) return;

    removeTopCandidate();

    try {
      const result = await matchingService.swipe(top.userId, direction);
      if (result.matched) {
        setMatchedName(top.displayName);
        setMatchModal(true);
      }
    } catch (err) {
      // Swipe already registered or rate limit
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Descobrir</Text>
        <Text style={styles.subtitle}>Baseado nos seus habitos de bem-estar</Text>
      </View>

      <View style={styles.cardArea}>
        {candidates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>Por ora e so isso</Text>
            <Text style={styles.emptyText}>Novos perfis aparecerao em breve. Continue sincronizando seus dados de saude.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadCandidates}>
              <Text style={styles.refreshText}>Atualizar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          candidates.slice(0, 3).map((profile, idx) => (
            <WellnessCard
              key={profile.userId}
              profile={profile}
              isTop={idx === 0}
              onLike={() => handleSwipe('like')}
              onDislike={() => handleSwipe('dislike')}
            />
          ))
        )}
      </View>

      {candidates.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.dislikeBtn} onPress={() => handleSwipe('dislike')}>
            <Text style={styles.actionIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeBtn} onPress={() => handleSwipe('like')}>
            <Text style={styles.actionIcon}>♥</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={matchModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.matchModal}>
            <Text style={styles.matchEmoji}>✨</Text>
            <Text style={styles.matchTitle}>E um Match!</Text>
            <Text style={styles.matchText}>Voce e {matchedName} combinam em habitos de bem-estar.</Text>
            <TouchableOpacity style={styles.matchBtn} onPress={() => setMatchModal(false)}>
              <Text style={styles.matchBtnText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.screen, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  cardArea: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  refreshBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshText: { color: colors.primary, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingBottom: 40,
    paddingTop: spacing.lg,
  },
  dislikeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.error,
  },
  likeBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  actionIcon: { fontSize: 24, color: colors.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchModal: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  matchEmoji: { fontSize: 48, marginBottom: spacing.md },
  matchTitle: { fontSize: 28, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm },
  matchText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  matchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  matchBtnText: { color: colors.background, fontWeight: '700', fontSize: 16 },
});
