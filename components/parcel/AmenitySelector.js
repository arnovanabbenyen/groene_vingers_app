import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CheckIcon,
  DropIcon,
  PlantIcon,
  PlusCircleIcon,
  RecycleIcon,
  ShovelIcon,
  TreeIcon,
  XCircleIcon,
} from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export const AMENITY_OPTIONS = [
  { label: 'Water', icon: DropIcon },
  { label: 'Tools', icon: ShovelIcon },
  { label: 'Zaden', icon: PlantIcon },
  { label: 'Compost', icon: RecycleIcon },
  { label: 'Bomen', icon: TreeIcon },
];

function getAmenityIcon(label) {
  return AMENITY_OPTIONS.find((o) => o.label === label)?.icon ?? TreeIcon;
}

export default function AmenitySelector({
  selected = [],
  onToggle,
  modalVisible,
  onOpenModal,
  onCloseModal,
}) {
  return (
    <>
      <View style={styles.chips}>
        {selected.length === 0 ? (
          <Pressable
            onPress={onOpenModal}
            style={({ pressed }) => [styles.empty, pressed && styles.emptyPressed]}
            accessibilityRole="button"
            accessibilityLabel="Voorzieningen toevoegen"
            accessibilityHint="Open de lijst met beschikbare voorzieningen"
          >
            <PlusCircleIcon size={20} color={COLORS.textMuted} weight="regular" />
            <Text style={styles.emptyText}>Geen voorzieningen toegevoegd</Text>
          </Pressable>
        ) : (
          selected.map((label) => {
            const Icon = getAmenityIcon(label);
            return (
              <View key={label} style={styles.chip}>
                <View style={styles.chipIconCircle}>
                  <Icon size={20} color={COLORS.surface} weight="regular" />
                </View>
                <Pressable
                  onPress={() => onToggle(label)}
                  style={styles.chipRemove}
                  accessibilityRole="button"
                  accessibilityLabel={`${label} verwijderen`}
                  hitSlop={10}
                >
                  <XCircleIcon size={18} color={COLORS.negative} weight="fill" />
                </Pressable>
                <Text style={styles.chipLabel}>{label}</Text>
              </View>
            );
          })
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={onCloseModal}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={onCloseModal} accessible={false}>
          <Pressable
            style={styles.sheet}
            onPress={() => {}}
            accessibilityRole="dialog"
            accessibilityLabel="Voorzieningen selecteren"
            accessibilityViewIsModal
          >
            <View style={styles.handle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />

            <Text style={styles.sheetTitle}>Voorzieningen</Text>
            <Text style={styles.sheetBody}>
              Selecteer de voorzieningen die beschikbaar zijn op dit perceel.
            </Text>

            <View style={styles.optionList}>
              {AMENITY_OPTIONS.map(({ label, icon: Icon }) => {
                const isSelected = selected.includes(label);
                return (
                  <Pressable
                    key={label}
                    onPress={() => onToggle(label)}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={label}
                  >
                    <View style={[styles.optionIconWrap, isSelected && styles.optionIconWrapSelected]}>
                      <Icon
                        size={20}
                        color={isSelected ? COLORS.surface : COLORS.textSecondary}
                        weight="regular"
                      />
                    </View>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {label}
                    </Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected ? (
                        <CheckIcon size={12} color={COLORS.surface} weight="bold" />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={onCloseModal}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Sluiten"
            >
              <Text style={styles.closeText}>Sluiten</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    alignItems: 'flex-start',
    minHeight: 64,
  },
  empty: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.dividerSoft,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  emptyPressed: {
    backgroundColor: COLORS.surfaceBrand,
    borderColor: COLORS.brandOverlayStroke,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  chip: {
    width: 54,
    alignItems: 'center',
    position: 'relative',
  },
  chipIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemove: {
    position: 'absolute',
    top: -5,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  chipLabel: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.sheet,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.dividerSoft,
    alignSelf: 'center',
    marginBottom: SPACING.xs,
  },
  sheetTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  sheetBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  optionList: {
    gap: SPACING.xs,
  },
  option: {
    minHeight: 52,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  optionSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.surfaceBrand,
  },
  optionPressed: {
    opacity: 0.8,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconWrapSelected: {
    backgroundColor: COLORS.brand,
  },
  optionLabel: {
    flex: 1,
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  optionLabelSelected: {
    color: COLORS.brand,
    fontFamily: FONTS.bodyMedium,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brand,
  },
  closeButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  closeButtonPressed: {
    opacity: 0.75,
  },
  closeText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
});
