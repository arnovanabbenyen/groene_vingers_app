import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput, AccessibilityInfo } from 'react-native';
import { ArrowLeft, PlusCircle, Camera } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../components/theme/tokens';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthTextArea from '../../components/auth/AuthTextArea';
import FieldError from '../../components/notifications/FieldError';
import AuthButton from '../../components/buttons/AuthButton';

// Assets from Figma MCP (local dev server)
const IMG_BACKGROUND = 'http://localhost:3845/assets/857199f83e6ee66097c2acbb287412099fc7b745.png';
const IMG_PLUS = 'http://localhost:3845/assets/8cf5c500f73c04c90540fb5d290d8a5ae12a9977.svg';
const IMG_PLUS_2 = 'http://localhost:3845/assets/c1866c4d3876072edd205eee3481f749f25757b4.svg';
const IMG_WATER = 'http://localhost:3845/assets/063801bb394747a450dc2eb31a860de553e409c7.svg';
const IMG_MATERIAAL = 'http://localhost:3845/assets/2f5dfb33af36eac04d4c671a125c2b9a8715ed88.svg';
const IMG_ZADEN = 'http://localhost:3845/assets/4eca3e172c3c8d9b87324a1cdd847cb1b1af0ada.svg';

export default function PerceelToevoegenScreen({ onBack, onSaved = () => {} }) {
  const [naam, setNaam] = useState('');
  const [fotos, setFotos] = useState([]);
  const [beschrijving, setBeschrijving] = useState('');
  const [voorzieningen, setVoorzieningen] = useState([]);
  const [extraInfo, setExtraInfo] = useState('');
  const [grootte, setGrootte] = useState('40m²');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const naamRef = useRef(null);

  function validate() {
    const next = {};
    if (!naam || naam.trim().length < 3) next.naam = 'Geef je perceel een korte titel.';
    if (!grootte || grootte.trim().length === 0) next.grootte = 'Vul de grootte in.';
    setErrors(next);

    if (Object.keys(next).length > 0) {
      const first = Object.keys(next)[0];
      AccessibilityInfo.announceForAccessibility(next[first]);
      if (first === 'naam' && naamRef.current) naamRef.current.focus();
    }

    return Object.keys(next).length === 0;
  }

  function addMockPhoto() {
    setFotos((prev) => [...prev, IMG_BACKGROUND]);
  }

  function toggleVoorziening(item) {
    setVoorzieningen((prev) => (prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]));
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        id: `perceel-${Date.now()}`,
        title: naam.trim(),
        size: grootte,
        location: '',
        ownerName: '',
        rating: '',
        description: beschrijving,
        stats: [
          { value: grootte, label: 'Grootte' },
          { value: 'Nu vrij', label: 'Beschikbaar' },
          { value: '4.5', label: 'Score' },
        ],
        images: fotos,
        voorzieningen,
        extraInfo,
      };

      // TODO: replace with Supabase insert into `percelen` when table exists
      console.log('Perceel opslaan (mock):', payload);
      setTimeout(() => {
        setLoading(false);
        onSaved(payload);
      }, 700);
    } catch (err) {
      setLoading(false);
      setErrors({ submit: err.message || 'Opslaan mislukt' });
      AccessibilityInfo.announceForAccessibility(err.message || 'Opslaan mislukt');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Terug">
          <ArrowLeft size={20} color={COLORS.surface} />
          <Text style={styles.backText}>Terug</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>Perceel toevoegen</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Camera size={20} color={COLORS.textPrimary} />
            <Text style={styles.cardTitle}>Naam van het perceel</Text>
          </View>

          <AuthTextField
            label=""
            placeholder="Welke naam krijgt je perceel..."
            value={naam}
            onChangeText={setNaam}
            accessibilityLabel="Naam van het perceel"
            accessibilityHint="Voer een korte titel in voor je perceel"
            ref={naamRef}
            onBlur={() => { if (!naam || naam.trim().length < 3) setErrors((s) => ({ ...s, naam: 'Geef je perceel een korte titel.' })); else setErrors((s) => { const n = { ...s }; delete n.naam; return n; }); }}
            error={!!errors.naam}
          />
          {errors.naam ? <FieldError message={errors.naam} /> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Camera size={20} color={COLORS.textPrimary} />
            <Text style={styles.cardTitle}>Foto’s</Text>
          </View>

          <View style={styles.photosRow}>
            <View style={styles.photoPreview}>
              <Image source={{ uri: IMG_BACKGROUND }} style={styles.photoImage} />
            </View>
            <Pressable style={styles.photoAdd} onPress={addMockPhoto} accessibilityRole="button" accessibilityLabel="Foto toevoegen">
              <PlusCircle size={24} color={COLORS.textSecondary} />
            </Pressable>
            <Pressable style={styles.photoAdd} onPress={addMockPhoto} accessibilityRole="button" accessibilityLabel="Foto toevoegen">
              <Image source={{ uri: IMG_PLUS_2 }} style={styles.plusSvg} />
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ width: 32 }} />
            <Text style={styles.cardTitle}>Beschrijving:</Text>
          </View>

          <AuthTextArea
            label=""
            placeholder="Schrijf een beschrijving voor je perceel..."
            value={beschrijving}
            onChangeText={setBeschrijving}
            height={216}
            accessibilityLabel="Beschrijving perceel"
            accessibilityHint="Beschrijf je perceel voor geïnteresseerden"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ width: 32 }} />
            <Text style={styles.cardTitle}>Voorzieningen</Text>
          </View>

          <View style={styles.voorzieningenRow}>
            <Pressable onPress={() => toggleVoorziening('Water')} style={styles.voorzieningItem} accessibilityRole="button" accessibilityState={{ selected: voorzieningen.includes('Water') }} accessibilityLabel="Water">
              <Image source={{ uri: IMG_WATER }} style={styles.voorzieningIcon} />
              <Text style={styles.voorzieningLabel}>Water</Text>
            </Pressable>
            <Pressable onPress={() => toggleVoorziening('Materiaal')} style={styles.voorzieningItem} accessibilityRole="button" accessibilityState={{ selected: voorzieningen.includes('Materiaal') }} accessibilityLabel="Materiaal">
              <Image source={{ uri: IMG_MATERIAAL }} style={styles.voorzieningIcon} />
              <Text style={styles.voorzieningLabel}>Materiaal</Text>
            </Pressable>
            <Pressable onPress={() => toggleVoorziening('Zaden')} style={styles.voorzieningItem} accessibilityRole="button" accessibilityState={{ selected: voorzieningen.includes('Zaden') }} accessibilityLabel="Zaden">
              <Image source={{ uri: IMG_ZADEN }} style={styles.voorzieningIcon} />
              <Text style={styles.voorzieningLabel}>Zaden</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ width: 32 }} />
            <Text style={styles.cardTitle}>Extra informatie</Text>
          </View>

          <View style={styles.extraRow}>
            <View style={styles.extraLeft}>
              <Text style={styles.extraLabel}>Grootte:</Text>
              <Text style={styles.extraValue}>{grootte}</Text>
            </View>
            <View style={styles.extraRight}>
              <Text style={styles.extraNote}>Tomatenplanten opgebonden en onderste bladeren gesnoeid</Text>
            </View>
          </View>
        </View>

        {errors.submit ? <FieldError message={errors.submit} /> : null}

        <View style={styles.buttonWrap}>
          <AuthButton label="Voeg perceel toe" onPress={handleSubmit} loading={loading} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.surface },
  header: { backgroundColor: COLORS.brand, paddingTop: 40, paddingBottom: 12, paddingHorizontal: SPACING.screenX, alignItems: 'center' },
  back: { position: 'absolute', left: SPACING.screenX, top: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { color: COLORS.surface, fontFamily: FONTS.body, fontSize: 16 },
  headerTitle: { color: COLORS.surface, fontFamily: FONTS.displaySemiBold, fontSize: 20 },
  content: { padding: SPACING.screenX, gap: SPACING.md, paddingBottom: 120 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, shadowColor: COLORS.shadow, shadowOpacity: 0.1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontFamily: FONTS.displaySemiBold, fontSize: 20, color: COLORS.textPrimary },
  photosRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  photoPreview: { width: 141, height: 121, borderRadius: RADIUS.md, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoAdd: { width: 141, height: 121, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  plusSvg: { width: 24, height: 24 },
  voorzieningItem: { alignItems: 'center', width: 70 },
  voorzieningIcon: { width: 50, height: 50, marginBottom: 8 },
  voorzieningLabel: { fontFamily: FONTS.displayMedium, fontSize: 14, textAlign: 'center' },
  voorzieningenRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  extraRow: { marginTop: 8 },
  extraLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  extraLabel: { fontFamily: FONTS.displayMedium, fontSize: 16 },
  extraValue: { fontFamily: FONTS.body, fontSize: 16 },
  extraRight: { marginTop: 8 },
  extraNote: { fontFamily: FONTS.body, fontSize: 16 },
  buttonWrap: { marginTop: SPACING.md },
});
