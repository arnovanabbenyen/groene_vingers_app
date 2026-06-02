import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckIcon, HandshakeIcon, PlantIcon, ShovelIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

const TYPE_META = {
  'Onderhoud helpen': {
    icon: ShovelIcon,
    description: 'De tuinzoeker helpt met het onderhoud van jouw tuin',
  },
  'Oogst delen': {
    icon: PlantIcon,
    description: 'De tuinzoeker deelt een deel van zijn oogst met jou',
  },
  'Andere dienst': {
    icon: HandshakeIcon,
    description: 'Spreek een andere vorm van samenwerking af met de tuinzoeker',
  },
};

export default function SamenwerkingSelector({ types = [], selected = [], onToggle }) {
  return (
    <View style={styles.list}>
      {types.map((type) => {
        const isSelected = selected.includes(type);
        const meta = TYPE_META[type];
        const Icon = meta?.icon ?? HandshakeIcon;

        return (
          <Pressable
            key={type}
            onPress={() => onToggle(type)}
            style={({ pressed }) => [
              styles.item,
              isSelected && styles.itemSelected,
              pressed && styles.itemPressed,
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={type}
            accessibilityHint={meta?.description}
          >
            <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
              <Icon
                size={18}
                color={isSelected ? COLORS.surface : COLORS.textSecondary}
                weight="regular"
              />
            </View>

            <View style={styles.textWrap}>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{type}</Text>
              {meta?.description ? (
                <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
                  {meta.description}
                </Text>
              ) : null}
            </View>

            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected ? <CheckIcon size={11} color={COLORS.surface} weight="bold" /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 56,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemSelected: {
    backgroundColor: COLORS.surfaceBrand,
    borderColor: COLORS.brand,
  },
  itemPressed: {
    opacity: 0.8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapSelected: {
    backgroundColor: COLORS.brand,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  labelSelected: {
    color: COLORS.brand,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  descriptionSelected: {
    color: COLORS.brandMid,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brand,
  },
});
