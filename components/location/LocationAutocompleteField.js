import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MapPinIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';
import { useLocationSearch } from '../../hooks/useLocationSearch';

const ERROR_BG = '#FBEAEA';

const LocationAutocompleteField = forwardRef(function LocationAutocompleteField({
  label,
  value,
  onSelect,
  onChangeText,
  placeholder = 'Bv. Leuven, Gent, Brussel',
  error = false,
  onBlur,
  onSubmitEditing,
  returnKeyType = 'next',
  accessibilityLabel,
  accessibilityHint,
  style,
}, ref) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState(value || '');
  const [focused, setFocused] = useState(false);
  const [hasPickedSuggestion, setHasPickedSuggestion] = useState(!!value);
  const isInitializedRef = useRef(!!value);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  useEffect(() => {
    if (!isInitializedRef.current && value) {
      isInitializedRef.current = true;
      setQuery(value);
      setHasPickedSuggestion(true);
    }
  }, [value]);

  const { suggestions, loading } = useLocationSearch(
    hasPickedSuggestion ? '' : query,
  );

  const showDropdown =
    focused &&
    !hasPickedSuggestion &&
    query.trim().length >= 2 &&
    (suggestions.length > 0 || loading);

  function handleChange(text) {
    setQuery(text);
    setHasPickedSuggestion(false);
    onChangeText?.(text);
  }

  function handleSelect(suggestion) {
    setQuery(suggestion.plaats);
    setHasPickedSuggestion(true);
    isInitializedRef.current = true;
    setFocused(false);
    Keyboard.dismiss();
    onSelect?.(suggestion);
  }

  function handleBlur() {
    setTimeout(() => setFocused(false), 150);
    onBlur?.();
  }

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputShell, error && styles.inputShellError]}>
        <MapPinIcon size={18} color={COLORS.border} weight="regular" accessibilityElementsHidden />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType={returnKeyType}
          blurOnSubmit={false}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint || 'Begin te typen om plaatsen te zoeken'}
          accessibilityRole="combobox"
        />
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.brand} />
        ) : null}
      </View>

      {showDropdown ? (
        <View style={styles.dropdown}>
          {suggestions.length === 0 ? (
            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownMuted}>Zoeken…</Text>
            </View>
          ) : (
            suggestions.map((suggestion, index) => (
              <Pressable
                key={suggestion.id}
                style={({ pressed }) => [
                  styles.dropdownRow,
                  index < suggestions.length - 1 && styles.dropdownRowBorder,
                  pressed && styles.dropdownRowPressed,
                ]}
                onPress={() => handleSelect(suggestion)}
                accessibilityRole="button"
                accessibilityLabel={`Selecteer ${suggestion.plaats}`}
              >
                <MapPinIcon size={14} color={COLORS.textSecondary} weight="regular" accessibilityElementsHidden />
                <Text style={styles.dropdownPlaats}>{suggestion.plaats}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
});

export default LocationAutocompleteField;

const styles = StyleSheet.create({
  wrap: {
    zIndex: 1,
    marginBottom: 14,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputShell: {
    height: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputShellError: {
    borderColor: COLORS.negative,
    backgroundColor: ERROR_BG,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  dropdown: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
  },
  dropdownRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dividerSoft,
  },
  dropdownRowPressed: {
    backgroundColor: COLORS.background,
  },
  dropdownPlaats: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  dropdownMuted: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
