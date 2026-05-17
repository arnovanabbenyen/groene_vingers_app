import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { XCircleIcon, X } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme/tokens';

// Reusable error UI. Modes: 'inline' | 'fullscreen' | 'toast'
export default function ErrorState({
  title = 'Er is iets misgegaan',
  message = 'Probeer het later opnieuw.',
  onRetry,
  onClose,
  mode = 'inline',
  compact = false,
}) {
  if (mode === 'fullscreen') {
    return (
      <View style={styles.fullscreenWrap}>
        <View style={styles.fullscreenCard}>
          <XCircleIcon size={56} color={COLORS.negative} weight="duotone" />
          <Text style={styles.fullscreenTitle}>{title}</Text>
          <Text style={styles.fullscreenMessage}>{message}</Text>
          {onRetry ? (
            <Pressable style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryText}>Opnieuw proberen</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  if (mode === 'toast') {
    return (
      <Animated.View style={[styles.toast, SHADOWS.nav]}>
        <View style={styles.toastInner}>
          <XCircleIcon size={20} color={COLORS.negative} weight="regular" />
          <Text style={styles.toastText}>{title}</Text>
        </View>
        <View style={styles.toastActions}>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.toastButton}>
              <Text style={styles.toastButtonText}>Opnieuw</Text>
            </Pressable>
          ) : null}
          {onClose ? (
            <Pressable onPress={onClose} style={styles.toastClose}>
              <X size={16} color={COLORS.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    );
  }

  // default: inline
  return (
    <View style={[styles.inlineWrap, compact && styles.inlineCompact]}>
      <XCircleIcon size={20} color={COLORS.negative} weight="regular" />
      <View style={styles.inlineMeta}>
        <Text style={styles.inlineTitle}>{title}</Text>
        {message ? <Text style={styles.inlineMessage}>{message}</Text> : null}
      </View>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.inlineAction}>
          <Text style={styles.inlineActionText}>Opnieuw</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.negativeSoft,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  inlineCompact: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  inlineMeta: {
    flex: 1,
  },
  inlineTitle: {
    color: COLORS.negative,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },
  inlineMessage: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 2,
  },
  inlineAction: {
    marginLeft: SPACING.sm,
  },
  inlineActionText: {
    color: COLORS.negative,
    fontFamily: FONTS.bodyMedium,
  },

  fullscreenWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: SPACING.lg,
  },
  fullscreenCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    width: '100%',
    maxWidth: 520,
    gap: SPACING.md,
  },
  fullscreenTitle: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.displaySemiBold,
    fontSize: 18,
  },
  fullscreenMessage: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.brand,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
  },
  retryText: {
    color: COLORS.textInverse,
    fontFamily: FONTS.bodyMedium,
  },

  toast: {
    position: 'absolute',
    left: SPACING.screenX,
    right: SPACING.screenX,
    bottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  toastText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyMedium,
  },
  toastActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastButton: {
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  toastButtonText: {
    color: COLORS.brand,
    fontFamily: FONTS.bodyMedium,
  },
  toastClose: {
    padding: SPACING.xs,
  },
});
