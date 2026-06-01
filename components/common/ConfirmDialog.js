import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

let _show = null;

export function showConfirm({ title, message, confirmLabel = 'Bevestigen', cancelLabel = 'Annuleren', onConfirm, onCancel }) {
  _show?.({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel });
}

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const translateY = useRef(new Animated.Value(300)).current;
  const insets = useSafeAreaInsets();

  const show = useCallback((options) => {
    setDialog(options);
    translateY.setValue(300);
    Animated.spring(translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
  }, [translateY]);

  useEffect(() => {
    _show = show;
    return () => { _show = null; };
  }, [show]);

  function dismiss(cb) {
    Animated.timing(translateY, { toValue: 300, duration: 220, useNativeDriver: true }).start(() => {
      setDialog(null);
      cb?.();
    });
  }

  return (
    <>
      {children}
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => dismiss(dialog?.onCancel)}
      >
        <Pressable style={styles.backdrop} onPress={() => dismiss(dialog?.onCancel)}>
          <Animated.View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.sm, transform: [{ translateY }] }]}
          >
            <Pressable>
              <View style={styles.handle} />
              <Text style={styles.title}>{dialog?.title}</Text>
              {dialog?.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
              <View style={styles.buttons}>
                <Pressable
                  style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
                  onPress={() => dismiss(dialog?.onCancel)}
                  accessibilityRole="button"
                  accessibilityLabel={dialog?.cancelLabel}
                >
                  <Text style={styles.cancelText}>{dialog?.cancelLabel}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.confirmButton, pressed && styles.buttonPressed]}
                  onPress={() => dismiss(dialog?.onConfirm)}
                  accessibilityRole="button"
                  accessibilityLabel={dialog?.confirmLabel}
                >
                  <Text style={styles.confirmText}>{dialog?.confirmLabel}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  buttons: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  cancelButton: {
    height: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.negative,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  cancelText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  confirmText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.surface,
  },
});
