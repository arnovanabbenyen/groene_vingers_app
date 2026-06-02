import { Pressable, StyleSheet, Text, View } from 'react-native';
import { XCircleIcon } from 'phosphor-react-native';
import AuthTextField from '../auth/AuthTextField';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

export default function ExtraInfoEditor({
  inputRef,
  draft,
  onDraftChange,
  items = [],
  onAdd,
  onRemove,
  placeholder = 'Voeg een punt toe en druk op gereed...',
  accessibilityLabel = 'Extra informatie invoerveld',
  accessibilityHint = 'Voer een punt in en druk op gereed om het toe te voegen aan de lijst',
}) {
  return (
    <View>
      <AuthTextField
        ref={inputRef}
        label=""
        value={draft}
        onChangeText={onDraftChange}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        variant="soft"
        returnKeyType="done"
        blurOnSubmit={false}
        onSubmitEditing={onAdd}
        onBlur={onAdd}
      />

      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.row}>
              <View style={styles.bulletWrap}>
                <View style={styles.bullet} />
              </View>
              <Text style={styles.text}>{item}</Text>
              <Pressable
                onPress={() => onRemove(index)}
                style={styles.removeButton}
                accessibilityRole="button"
                accessibilityLabel={`"${item}" verwijderen`}
                hitSlop={12}
              >
                <XCircleIcon size={20} color={COLORS.negative} weight="fill" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 32,
  },
  bulletWrap: {
    width: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  text: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
