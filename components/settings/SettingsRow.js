import React from 'react';
import { Pressable, StyleSheet, Text, View, Switch } from 'react-native';
import { CaretRight } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';

export default function SettingsRow({
  title,
  subtitle,
  onPress,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
  icon,
}) {
  const Right = () => {
    if (showSwitch) {
      return <Switch value={switchValue} onValueChange={onSwitchChange} />;
    }

    return <CaretRight size={18} color={COLORS.textMuted} weight="regular" />;
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.left}>{icon}</View>

      <View style={styles.meta}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>
        <Right />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.screenX,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  pressed: { opacity: 0.85 },
  left: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  meta: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
  },
  subtitle: {
    marginTop: 2,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  right: {
    marginLeft: SPACING.sm,
  },
});
