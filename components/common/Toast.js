import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircleIcon, EyeSlashIcon, InfoIcon, WarningCircleIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

let _trigger = null;

export function showToast(message, type = 'success') {
  _trigger?.(message, type);
}

const ICON_CONFIG = {
  success: { Icon: CheckCircleIcon, color: COLORS.brand },
  warning: { Icon: EyeSlashIcon, color: COLORS.accent },
  info: { Icon: InfoIcon, color: COLORS.textSecondary },
  error: { Icon: WarningCircleIcon, color: COLORS.negative },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const hideTimer = useRef(null);
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const trigger = useCallback(
    (message, type = 'success') => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      translateY.setValue(-80);
      opacity.setValue(0);
      setToast({ message, type });

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      hideTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => setToast(null));
      }, 3000);
    },
    [translateY, opacity],
  );

  useEffect(() => {
    _trigger = trigger;
    return () => {
      _trigger = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [trigger]);

  const config = (toast && ICON_CONFIG[toast.type]) ?? ICON_CONFIG.success;
  const { Icon, color } = config;

  return (
    <>
      {children}
      {toast ? (
        <Animated.View
          style={[
            styles.container,
            { top: insets.top + SPACING.sm, opacity, transform: [{ translateY }] },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.toast, { borderLeftColor: color }]}>
            <Icon size={18} color={color} weight="fill" accessibilityElementsHidden />
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 20,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xs,
  },
  toast: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderLeftWidth: 3,
    ...SHADOWS.card,
  },
  message: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
});
