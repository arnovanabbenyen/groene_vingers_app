import React, { useEffect, useRef, useState } from 'react';
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
import { COLORS, FONTS, RADIUS } from '../theme/tokens';
import { useLocationSearch } from '../../hooks/useLocationSearch';

const ERROR_BG = '#FBEAEA';

export default function LocationAutocompleteField({
  label,
  value,
  onSelect,
  onChangeText,
  placeholder = 'Bv. Leuven, Gent, Brussel',
  error = false,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
}) {
  const [query, setQuery] = useState(value || '');
  const [focused, setFocused] = useState(false);
  const [hasPickedSuggestion, setHasPickedSuggestion] = useState(!!value);
  const isInitializedRef = useRef(!!value);

  // Sync when external value arrives asynchronously (e.g. profile loading from Supabase)
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
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputShell, error && styles.inputShellError]}>
        <MapPinIcon size={18} color={COLORS.border} weight="regular" />
        <TextInput
          value={query}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.border}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
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
                <MapPinIcon size={14} color={COLORS.textSecondary} weight="regular" />
                <View style={styles.dropdownText}>
                  <Text style={styles.dropdownPlaats}>{suggestion.plaats}</Text>
                  <Text style={styles.dropdownAdres} numberOfLines={1}>
                    {suggestion.displayName}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    zIndex: 1,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputShell: {
    height: 40,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputShellError: {
    borderColor: COLORS.negative,
    backgroundColor: ERROR_BG,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xs,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dividerSoft,
  },
  dropdownRowPressed: {
    backgroundColor: COLORS.background,
  },
  dropdownText: {
    flex: 1,
    gap: 2,
  },
  dropdownPlaats: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  dropdownAdres: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  dropdownMuted: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
