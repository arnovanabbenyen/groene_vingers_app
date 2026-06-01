import React, { useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function DateBlockSelector({ value, onChange, minimumDate, maximumDate, accessibilityLabel = 'Datum' }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(300)).current;

  function open() {
    sheetAnim.setValue(300);
    setVisible(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }

  function close() {
    Animated.timing(sheetAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }

  const blocks = [
    {
      label: 'Dag',
      display: String(value.getDate()).padStart(2, '0'),
      a11y: `Dag: ${value.getDate()}. Tik om de datum te wijzigen`,
    },
    {
      label: 'Maand',
      display: value.toLocaleDateString('nl-BE', { month: 'long' }),
      a11y: `Maand: ${value.toLocaleDateString('nl-BE', { month: 'long' })}. Tik om de datum te wijzigen`,
    },
    {
      label: 'Jaar',
      display: String(value.getFullYear()),
      a11y: `Jaar: ${value.getFullYear()}. Tik om de datum te wijzigen`,
    },
  ];

  return (
    <>
      <View style={styles.blocks} accessibilityRole="group" accessibilityLabel="Gewenste startdatum">
        {blocks.map((block) => (
          <Pressable
            key={block.label}
            style={[styles.block, visible && styles.blockActive]}
            onPress={open}
            accessibilityRole="button"
            accessibilityLabel={block.a11y}
          >
            <Text style={styles.blockLabel}>{block.label}</Text>
            <Text
              style={[styles.blockValue, visible && styles.blockValueActive]}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {block.display}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
      >
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Sluit datumkiezer"
        />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + SPACING.md, transform: [{ translateY: sheetAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} accessibilityElementsHidden />
          <DateTimePicker
            value={value}
            mode="date"
            display="spinner"
            onChange={(_, selected) => { if (selected) onChange(selected); }}
            minimumDate={minimumDate}
            locale="nl-BE"
          />
          <View style={styles.doneWrap}>
            <Pressable
              style={styles.doneBtn}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Datum bevestigen"
            >
              <Text style={styles.doneBtnText}>Klaar</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  blocks: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  block: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.xxs,
    minHeight: 60,
    justifyContent: 'center',
  },
  blockActive: {
    borderColor: COLORS.brand,
  },
  blockLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xxs,
    color: COLORS.textSecondary,
  },
  blockValue: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  blockValueActive: {
    color: COLORS.brand,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.screenX,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.indicatorMuted,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  doneWrap: {
    paddingTop: SPACING.md,
  },
  doneBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },
});
