import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Modal,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { WellnessCard } from '../../components/cards/WellnessCard';
import { matchingService } from '../../services/matching.service';
import { moderationService } from '../../services/moderation.service';
import { BlockUserButton } from '../../components/moderation/BlockUserButton';
import { useMatchStore } from '../../store/match.slice';

export const MatchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { candidates, setCandidates, removeTopCandidate } = useMatchStore();
  const [loading, setLoading] = useState(false);
  const [swiping, setSwiping] = useState(false);
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

  const handleSwipe = async (direction: 'like' | 'dislike' | 'super_like') => {
    if (swiping) return;
    const top = candidates[0];
    if (!top) return;
    if (!top.userId) {
      Alert.alert('Erro', 'Perfil inválido: candidato sem identificador.');
      return;
    }

    setSwiping(true);
    try {
      const result = await matchingService.swipe(top.userId, direction);
      removeTopCandidate();
      if (result.matched) {
        setMatchedName(top.displayName ?? 'Usuário');
        setMatchModal(true);
      }
    } catch (err: any) {
      console.error('Swipe failed', err);
      const message = err?.response?.data?.message;
      Alert.alert('Erro no swipe', Array.isArray(message) ? message.join('\n') : message ?? 'Não foi possível registrar sua escolha.');
    } finally {
      setSwiping(false);
    }
  };

  const currentUserId = candidates[0]?.userId;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Descobrir</Text>
        <Text style={styles.subtitle}>Baseado nos seus hábitos de bem-estar</Text>
      </View>

      <View style={styles.cardArea}>
        {candidates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>Por ora é só isso</Text>
            <Text style={styles.emptyText}>Novos perfis aparecerão em breve. Continue sincronizando seus dados de saúde.</Text>
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
        <>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.dislikeBtn, swiping && styles.actionDisabled]}
              onPress={() => handleSwipe('dislike')}
              disabled={swiping}
            >
              <Text style={styles.actionIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.superLikeBtn, swiping && styles.actionDisabled]}
              onPress={() => handleSwipe('super_like')}
              disabled={swiping}
            >
              <Text style={styles.actionIcon}>★</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.likeBtn, swiping && styles.actionDisabled]}
              onPress={() => handleSwipe('like')}
              disabled={swiping}
            >
              <Text style={styles.actionIcon}>♥</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.moderationRow}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => {
                if (currentUserId) {
                  navigation.navigate('ReportUser', { targetUserId: currentUserId });
                }
              }}
            >
              <Text style={styles.ghostBtnText}>Denunciar</Text>
            </TouchableOpacity>

            <View style={styles.blockBtnWrapper}>
              <BlockUserButton targetUserId={currentUserId!} />
            </View>
          </View>
        </>
      )}

      <Modal visible={matchModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.matchModal}>
            <Text style={styles.matchEmoji}>✨</Text>
            <Text style={styles.matchTitle}>É um Match!</Text>
            <Text style={styles.matchText}>Você e {matchedName} combinam em hábitos de bem-estar.</Text>
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
    alignItems: 'center',
    gap: 24,
    paddingBottom: spacing.sm,
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
  superLikeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  actionDisabled: { opacity: 0.45 },
  actionIcon: { fontSize: 24, color: colors.text },
  moderationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: 32,
    paddingTop: spacing.sm,
  },
  ghostBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  ghostBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  blockBtnWrapper: {
    transform: [{ scale: 0.85 }],
  },
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
