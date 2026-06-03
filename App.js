import React, { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import AppProviders from './providers/AppProviders';
import IntroScreen from './screens/intro/IntroScreen';
import HomeScreen from './screens/home/HomeScreen';
import LoginScreen from './screens/auth/LoginScreen';
import PasswordResetScreen from './screens/auth/PasswordResetScreen';
import PasswordResetSentScreen from './screens/auth/PasswordResetSentScreen';
import TuineigenaarHomeScreen from './screens/home/TuineigenaarHomeScreen';
import MeldingenScreen from './screens/notifications/MeldingenScreen';
import ProfielScreen from './screens/profile/ProfielScreen';
import OpgeslagenScreen from './screens/saved/OpgeslagenScreen';
import ParcelDetailScreen from './screens/parcel/ParcelDetailScreen';
import PerceelToevoegenScreen from './screens/parcel/PerceelToevoegenScreen';
import ProfielBewerkenScreen from './screens/profile/ProfielBewerkenScreen';
import InstellingenScreen from './screens/settings/InstellingenScreen';
import NotificatieInstellingenScreen from './screens/settings/NotificatieInstellingenScreen';
import PlansScreen from './screens/plans/PlansScreen';
import EindSamenwerkingScreen from './screens/samenwerking/EindSamenwerkingScreen';
import SamenwerkingBeeindigdScreen from './screens/samenwerking/SamenwerkingBeeindigdScreen';
import SamenwerkingDetailScreen from './screens/samenwerking/SamenwerkingDetailScreen';
import LogboekHomeScreen from './screens/loggen/LogboekHomeScreen';
import LogDetailScreen from './screens/loggen/LogDetailScreen';
import LogboekMonthScreen from './screens/loggen/LogboekMonthScreen';
import OpvolgingenScreen from './screens/loggen/OpvolgingenScreen';
import NieuweOpvolgingScreen from './screens/loggen/NieuweOpvolgingScreen';
import WeeklyGoalScreen from './screens/settings/WeeklyGoalScreen';
import WachtwoordWijzigenScreen from './screens/settings/WachtwoordWijzigenScreen';
import { usePendingAanvragen } from './hooks/usePendingAanvragen';
import { useNotifications } from './hooks/useNotifications';
import { useActiveSamenwerking } from './hooks/useActiveSamenwerking';
import { useFavorites } from './hooks/useFavorites';
import { useUserProfile } from './hooks/useUserProfile';
import AanvraagDoenScreen from './screens/aanvraag/AanvraagDoenScreen';
import GeenToegangScreen from './screens/aanvraag/GeenToegangScreen';
import AanvraagBevestigingScreen from './screens/aanvraag/AanvraagBevestigingScreen';
import OnboardingContainer from './screens/auth/OnboardingContainer';
import RoleSelectionScreen from './screens/auth/RoleSelectionScreen';
import AccountDetailsScreen from './screens/auth/AccountDetailsScreen';
import PhotoScreen from './screens/auth/PhotoScreen';
import CoverPhotoScreen from './screens/auth/CoverPhotoScreen';
import BioScreen from './screens/auth/BioScreen';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import { supabase } from './services/supabase';
import { savePendingPhotos, readPendingPhotos, clearPendingPhotos } from './services/pendingPhotos';
import { showToast } from './components/common/Toast';
import { showConfirm } from './components/common/ConfirmDialog';

export default function App() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [notificationsRefreshKey, setNotificationsRefreshKey] = useState(0);
  const {
    unreadCount: unreadNotificationsCountRaw,
    notifications,
    isLoading: isLoadingNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
  } = useNotifications(currentUserId, notificationsRefreshKey);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { plan: userPlan } = useUserProfile();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState('intro');
  const [selectedRole, setSelectedRole] = useState('tuinzoeker');
  const [verzoekenCount, setVerzoekenCount] = useState(0);
  const [aanvragenRefreshKey, setAanvragenRefreshKey] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('home');
  const unreadNotificationsCount = currentScreen === 'meldingen' ? 0 : unreadNotificationsCountRaw;
  const [selectedAanvraag, setSelectedAanvraag] = useState(null);
  const [selectedAanvraagSource, setSelectedAanvraagSource] = useState('home');
  const [profileDraft, setProfileDraft] = useState(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);
  const [coverPhotoUri, setCoverPhotoUri] = useState(null);
  const [draftBio, setDraftBio] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [lastResetEmail, setLastResetEmail] = useState('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [conversationsRefreshKey, setConversationsRefreshKey] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [homeTabRequest, setHomeTabRequest] = useState(null);
  const [profielRefreshKey, setProfielRefreshKey] = useState(0);
  const [profielBewerkenSource, setProfielBewerkenSource] = useState('profiel');
  const [selectedSavedPerceel, setSelectedSavedPerceel] = useState(null);
  const [opgeslagenSource, setOpgeslagenSource] = useState('home');
  const [selectedSamenwerking, setSelectedSamenwerking] = useState(null);
  const [samenwerkingRefreshKey, setSamenwerkingRefreshKey] = useState(0);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [endingMode, setEndingMode] = useState('initiator');
  const [beeindigdAanvraagId, setBeeindigdAanvraagId] = useState(null);
  const [detailSamenwerking, setDetailSamenwerking] = useState(null);
  const [weeklyGoalSource, setWeeklyGoalSource] = useState('instellingen');
  const [opvolgingRefreshKey, setOpvolgingRefreshKey] = useState(0);
  const [selectedProfielPerceel, setSelectedProfielPerceel] = useState(null);
  const [selectedProfielAanvraag, setSelectedProfielAanvraag] = useState(null);
  const homeInitialTabRef = useRef('start');
  const { aanvragen: pendingAanvragen } = usePendingAanvragen(aanvragenRefreshKey);
  const { samenwerking: activeSamenwerking, isLoading: isLoadingActiveSamenwerking } =
    useActiveSamenwerking(samenwerkingRefreshKey);

  function handleLogout() {
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setCurrentScreen('home');
    setSelectedAanvraag(null);
    setSelectedAanvraagSource('home');
    setHomeTabRequest(null);
  }

  async function uploadPhoto(bucket, userId, filename, localUri) {
    const base64Encoding = FileSystem.EncodingType?.Base64 ?? 'base64';
    const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: base64Encoding });
    const arrayBuffer = decodeBase64(base64);
    if (arrayBuffer.byteLength === 0) throw new Error('Afbeelding kon niet worden gelezen.');
    const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const filePath = `${userId}/${filename}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, { contentType: mime, upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl;
    if (publicUrl) {
      const field = filename === 'cover' ? 'cover_url' : 'avatar_url';
      const { error: updateError } = await supabase.from('profiles').update({ [field]: publicUrl }).eq('id', userId);
      if (updateError) throw updateError;
    }
  }

  async function handleCompleteSignUp(bio) {
    if (!supabase) {
      Alert.alert('Verbinding niet beschikbaar', 'Controleer je internetverbinding.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: profileDraft.email,
        password: profileDraft.password,
        options: {
          emailRedirectTo: 'groenevingers://',
          data: {
            first_name: profileDraft.firstName,
            last_name: profileDraft.lastName,
            role: selectedRole,
            bio: bio || '',
            plaats: profileDraft.plaats || '',
          },
        },
      });

      if (error) {
        Alert.alert('Account aanmaken mislukt', error.message || 'Probeer het opnieuw.');
        return;
      }

      // Supabase enum-protection: duplicate email + email confirmation →
      // { user: null, session: null, error: null }. Treat as "check je inbox".
      if (!data.user) {
        setNeedsEmailVerification(true);
        setScreen('welcome');
        return;
      }

      const userId = data.user.id;
      const requiresEmailVerification = !data.session;
      setNeedsEmailVerification(requiresEmailVerification);
      if (requiresEmailVerification) setSignedUpEmail(data.user.email);

      // Only upload photos when there's an active session (RLS requires auth.uid())
      if (!requiresEmailVerification) {
        if (profilePhotoUri) {
          try { await uploadPhoto('profile-pfp', userId, 'avatar', profilePhotoUri); }
          catch (err) { console.warn('Profile photo upload failed:', err); }
        }
        if (coverPhotoUri) {
          try { await uploadPhoto('profile-covers', userId, 'cover', coverPhotoUri); }
          catch (err) { console.warn('Cover photo upload failed:', err); }
        }
      } else if (profilePhotoUri || coverPhotoUri) {
        // Persist photo URIs so they survive a cold start before email verification
        await savePendingPhotos({ profilePhotoUri, coverPhotoUri, userId });
      }

      setScreen('welcome');
    } catch (err) {
      Alert.alert('Account aanmaken mislukt', err.message || 'Probeer het opnieuw.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      setAanvragenRefreshKey((k) => k + 1);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || selectedRole !== 'tuineigenaar') {
      setVerzoekenCount(0);
      return;
    }

    setVerzoekenCount(pendingAanvragen.length);
    // TODO: use a real-time subscription or React Context to keep the badge count in sync with accepted/declined actions. For MVP, count refreshes when the user logs in or navigates.
  }, [isLoggedIn, selectedRole, pendingAanvragen.length]);

  useEffect(() => {
    let mounted = true;

    async function loadUnreadMessagesCount() {
      if (!isLoggedIn || !supabase) {
        if (mounted) setUnreadMessagesCount(0);
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const userId = sessionData?.session?.user?.id;
        if (!userId) {
          if (mounted) setUnreadMessagesCount(0);
          return;
        }

        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select('id, aanvragen!inner(status)')
          .or(`owner_id.eq.${userId},sender_id.eq.${userId}`)
          .not('aanvragen.status', 'in', '("ended","cancelled","declined")');

        if (conversationsError) throw conversationsError;

        const conversationIds = (conversations || []).map((conversation) => conversation.id);
        if (conversationIds.length === 0) {
          if (mounted) setUnreadMessagesCount(0);
          return;
        }

        const { count, error: messagesError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', userId)
          .is('read_at', null);

        if (messagesError) throw messagesError;

        if (mounted) setUnreadMessagesCount(count || 0);
      } catch (err) {
        console.warn('Failed to load unread message count', err);
        if (mounted) setUnreadMessagesCount(0);
      }
    }

    loadUnreadMessagesCount();
    return () => {
      mounted = false;
    };
  }, [isLoggedIn, selectedRole, conversationsRefreshKey]);

  useEffect(() => {
    if (!isLoggedIn || !supabase) return;

    let channel = null;

    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id;
      if (!userId) return;

      channel = supabase
        .channel(`messages-unread-watch-${Math.random()}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            if (payload.new?.sender_id !== userId && !payload.new?.read_at) {
              setConversationsRefreshKey((k) => k + 1);
            }
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload) => {
            if (payload.new?.read_at && payload.new?.sender_id !== userId) {
              setConversationsRefreshKey((k) => k + 1);
            }
          }
        )
        .subscribe();
    });

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [isLoggedIn]);

  function handleViewAanvraag(aanvraag, sourceScreen = 'home') {
    setSelectedAanvraag(aanvraag);
    setSelectedAanvraagSource(sourceScreen);
    setCurrentScreen('aanvraag-detail');
  }

  function handleCloseAanvraag() {
    setCurrentScreen(selectedAanvraagSource || 'home');
    setSelectedAanvraag(null);
  }

  function handleAanvraagActionComplete() {
    setAanvragenRefreshKey((current) => current + 1);
    setConversationsRefreshKey((current) => current + 1);
  }

  async function handleToggleProfielPerceel() {
    if (!selectedProfielPerceel) return;
    const newStatus = selectedProfielPerceel.status === 'hidden' ? 'active' : 'hidden';
    const isHiding = newStatus === 'hidden';
    const { error } = await supabase
      .from('percelen')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', selectedProfielPerceel.id);
    if (error) {
      showToast('Zichtbaarheid kon niet worden bijgewerkt. Probeer opnieuw.', 'error');
      return;
    }
    setSelectedProfielPerceel((prev) => ({ ...prev, status: newStatus }));
    setProfielRefreshKey((k) => k + 1);
    showToast(
      isHiding
        ? 'Perceel is nu verborgen voor tuinzoekers'
        : 'Perceel is weer zichtbaar voor tuinzoekers',
      isHiding ? 'warning' : 'success',
    );
  }

  function handleDeleteProfielPerceel() {
    if (!selectedProfielPerceel) return;
    showConfirm({
      title: 'Perceel verwijderen?',
      message: 'Lopende aanvragen blijven bewaard, maar het perceel verdwijnt uit de app.',
      confirmLabel: 'Verwijderen',
      onConfirm: async () => {
        const { error } = await supabase
          .from('percelen')
          .update({ status: 'deleted', updated_at: new Date().toISOString() })
          .eq('id', selectedProfielPerceel.id);
        if (error) {
          showToast('Perceel kon niet worden verwijderd. Probeer opnieuw.', 'error');
          return;
        }
        setSelectedProfielPerceel(null);
        setCurrentScreen('profiel');
        setProfielRefreshKey((k) => k + 1);
        showToast('Perceel is verwijderd', 'info');
      },
    });
  }

  function handleOpenConversation(conversation) {
    setHomeTabRequest(null);
    setSelectedConversation(conversation);
    setCurrentScreen('conversation-detail');
  }

  function handleCloseConversation() {
    setSelectedConversation(null);
    setCurrentScreen('home');
    setHomeTabRequest('berichten');
    setConversationsRefreshKey((current) => current + 1);
  }

  async function handleNotificationNavigateToAanvraag(aanvraagId) {
    if (!supabase || !aanvraagId) return;
    const { data } = await supabase
      .from('aanvragen')
      .select('id, sender_id, motivation, availability, start_date, status, type_samenwerking, created_at, perceel:percelen!inner(id, naam, grootte, plaats, voorzieningen, fotos, owner_id)')
      .eq('id', aanvraagId)
      .maybeSingle();
    if (!data) return;
    if (['accepted', 'declined', 'cancelled'].includes(data.status)) {
      showToast('Deze aanvraag is niet meer beschikbaar.', 'info');
      return;
    }
    const { data: sender } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', data.sender_id)
      .maybeSingle();
    setSelectedAanvraag({ ...data, sender: sender || null });
    setSelectedAanvraagSource('meldingen');
    setCurrentScreen('aanvraag-detail');
  }

  async function enrichAndOpenConversation(conv) {
    if (!conv) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const otherUserId = conv.owner_id === userId ? conv.sender_id : conv.owner_id;
    let otherUser = null;
    if (otherUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', otherUserId)
        .maybeSingle();
      otherUser = profile || null;
    }
    setHomeTabRequest(null);
    setSelectedConversation({ ...conv, otherUser });
    setCurrentScreen('conversation-detail');
  }

  async function handleNotificationNavigateToAanvraagConversation(aanvraagId) {
    if (!supabase || !aanvraagId) return;
    const { data: aanvraag } = await supabase
      .from('aanvragen')
      .select('status')
      .eq('id', aanvraagId)
      .maybeSingle();
    if (['cancelled', 'declined', 'ended'].includes(aanvraag?.status)) {
      showToast('Dit gesprek is niet meer beschikbaar.', 'info');
      return;
    }
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, aanvraag_id, owner_id, sender_id, created_at, last_message_at')
      .eq('aanvraag_id', aanvraagId)
      .maybeSingle();
    await enrichAndOpenConversation(conv);
  }

  async function handleNotificationNavigateToConversation(conversationId) {
    if (!supabase || !conversationId) return;
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, aanvraag_id, owner_id, sender_id, created_at, last_message_at')
      .eq('id', conversationId)
      .maybeSingle();
    if (!conv) return;
    if (conv.aanvraag_id) {
      const { data: aanvraag } = await supabase
        .from('aanvragen')
        .select('status')
        .eq('id', conv.aanvraag_id)
        .maybeSingle();
      if (['cancelled', 'declined', 'ended'].includes(aanvraag?.status)) {
        showToast('Dit gesprek is niet meer beschikbaar.', 'info');
        return;
      }
    }
    await enrichAndOpenConversation(conv);
  }

  async function handleNotificationNavigateToAanvraagPerceel(aanvraagId) {
    if (!supabase || !aanvraagId) return;
    const { data } = await supabase
      .from('aanvragen')
      .select('percelen(id, owner_id, naam, beschrijving, grootte, adres, plaats, fotos, voorzieningen, voorkeur_samenwerking, approximate_lat, approximate_lng, lat, lng, extra_info, status, created_at)')
      .eq('id', aanvraagId)
      .maybeSingle();
    if (!data?.percelen) return;
    setSelectedProfielPerceel(data.percelen);
    setCurrentScreen('profiel-perceel-detail');
  }


  // Handle deep links (groenevingers://) that carry auth callbacks from email confirmation
  useEffect(() => {
    if (!supabase) return;

    async function handleUrl(url) {
      if (!url) return;

      // TokenHash flow: direct mobile deep link (groenevingers://verify?token_hash=XXX&type=signup)
      if (url.includes('token_hash=')) {
        try {
          const queryIndex = url.indexOf('?');
          const params = new URLSearchParams(queryIndex !== -1 ? url.slice(queryIndex + 1) : url);
          const token_hash = params.get('token_hash');
          const type = params.get('type') || 'email';
          if (token_hash) {
            const { error } = await supabase.auth.verifyOtp({ token_hash, type });
            if (error) console.warn('verifyOtp failed', error);
            // onAuthStateChange fires SIGNED_IN → sets isLoggedIn(true) + uploads pending photos
          }
        } catch (err) {
          console.warn('Deep link token_hash verification failed', err);
        }
        return;
      }

      // PKCE flow: Supabase sends a code= query param
      if (url.includes('code=')) {
        try {
          await supabase.auth.exchangeCodeForSession(url);
        } catch (err) {
          console.warn('Deep link PKCE exchange failed', err);
        }
        return;
      }

      // Implicit flow (default): tokens arrive in hash (#) or query string (?)
      if (url.includes('access_token')) {
        try {
          const hashIndex = url.indexOf('#');
          const queryIndex = url.indexOf('?');
          const separatorIndex = hashIndex !== -1 ? hashIndex : queryIndex;
          if (separatorIndex === -1) return;
          const params = new URLSearchParams(url.slice(separatorIndex + 1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
            // onAuthStateChange fires SIGNED_IN → sets isLoggedIn(true) + uploads pending photos
          }
        } catch (err) {
          console.warn('Deep link implicit session failed', err);
        }
      }
    }

    // App opened via link (cold start)
    Linking.getInitialURL().then(handleUrl);

    // Link received while app is already running
    const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase is not configured; skipping auth session restore on startup.');
      return undefined;
    }

    let mounted = true;

    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.log('supabase getSession error', error);
          if (error.message?.toLowerCase().includes('refresh token')) {
            await supabase.auth.signOut();
          }
          return;
        }

        const session = data?.session;
        const user = session?.user;
        if (user) {
          let role = user.user_metadata?.role;

          if (!role) {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
              if (profileError) console.log('profile fetch error', profileError);
              if (profile?.role) role = profile.role;
            } catch (e) {
              console.log('error fetching profile role', e);
            }
          }

          if (mounted) {
            if (role) setSelectedRole(role);
            setCurrentUserId(user.id);
            setIsLoggedIn(true);
            setSamenwerkingRefreshKey((k) => k + 1);
          }
        }
      } catch (err) {
        console.log('restoreSession error', err);
        if (err?.message?.toLowerCase().includes('refresh token')) {
          await supabase.auth.signOut();
        }
      }
    }

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION fires on cold start with an existing session.
      // Handle it identically to SIGNED_IN so deferred photos are uploaded on startup.
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        const user = session?.user;
        const role = user?.user_metadata?.role;
        if (role) setSelectedRole(role);
        if (user?.id) setCurrentUserId(user.id);
        setIsLoggedIn(true);
        setSamenwerkingRefreshKey((k) => k + 1);

        // Upload photos deferred from signup (survives cold starts via AsyncStorage)
        if (user?.id) {
          const pending = await readPendingPhotos();
          if (pending?.userId === user.id) {
            // Wait for session to fully propagate (max 2 seconds, polling every 200ms).
            // Storage RLS needs auth.uid() to match user.id.
            let activeSession = null;
            for (let attempt = 0; attempt < 10; attempt++) {
              const { data } = await supabase.auth.getSession();
              if (data?.session?.user?.id === user.id) {
                activeSession = data.session;
                break;
              }
              await new Promise((r) => setTimeout(r, 200));
            }

            if (!activeSession) {
              console.warn('Pending photos: session never propagated for user', user.id);
              return;
            }

            // Session is now active and matches the user. Safe to upload.
            let avatarSucceeded = !pending.profilePhotoUri;
            let coverSucceeded = !pending.coverPhotoUri;
            if (pending.profilePhotoUri) {
              try {
                await uploadPhoto('profile-pfp', user.id, 'avatar', pending.profilePhotoUri);
                avatarSucceeded = true;
                console.log('Deferred avatar uploaded successfully');
              } catch (err) {
                console.warn('Deferred avatar upload failed:', err.message);
              }
            }
            if (pending.coverPhotoUri) {
              try {
                await uploadPhoto('profile-covers', user.id, 'cover', pending.coverPhotoUri);
                coverSucceeded = true;
                console.log('Deferred cover uploaded successfully');
              } catch (err) {
                console.warn('Deferred cover upload failed:', err.message);
              }
            }

            // Clear only when both needed uploads have completed successfully.
            if (avatarSucceeded && coverSucceeded) {
              await clearPendingPhotos();
            } else {
              console.warn('Pending photos: some uploads failed, keeping in AsyncStorage for retry');
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setSelectedRole('tuinzoeker');
        setCurrentUserId(null);
        setCurrentScreen('home');
        setSelectedAanvraag(null);
        setSelectedAanvraagSource('home');
        setHomeTabRequest(null);
      }
    });

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    };
  }, []);
 
 
  return (
    <AppProviders>
      {isLoggedIn ? (
        currentScreen === 'opgeslagen-aanvraag-bevestigd' ? (
          <AanvraagBevestigingScreen
            perceel={selectedSavedPerceel}
            onBackToListings={() => setCurrentScreen('opgeslagen')}
            onBackToMessages={() => setCurrentScreen('home')}
          />
        ) : currentScreen === 'opgeslagen-aanvraag' ? (
          <AanvraagDoenScreen
            perceel={selectedSavedPerceel}
            onBack={() => setCurrentScreen('opgeslagen-detail')}
            onContinue={(res) => {
              if (res?.success) {
                setCurrentScreen('opgeslagen-aanvraag-bevestigd');
              } else {
                setCurrentScreen('opgeslagen-detail');
              }
            }}
          />
        ) : currentScreen === 'opgeslagen-geen-toegang' ? (
          <GeenToegangScreen
            onBack={() => setCurrentScreen('opgeslagen-detail')}
            onUpgrade={() => setCurrentScreen('opgeslagen-plans')}
          />
        ) : currentScreen === 'opgeslagen-plans' ? (
          <PlansScreen
            onBack={() => setCurrentScreen('opgeslagen-geen-toegang')}
            onUpgradeSuccess={() => setCurrentScreen('opgeslagen-aanvraag')}
          />
        ) : currentScreen === 'opgeslagen-detail' ? (
          <ParcelDetailScreen
            perceel={selectedSavedPerceel || {}}
            onBack={() => {
              setCurrentScreen(opgeslagenSource || 'home');
              setSelectedSavedPerceel(null);
            }}
            showFavoriteButton
            isFavorited={isFavorite(selectedSavedPerceel?.id)}
            onToggleFavorite={() => toggleFavorite(selectedSavedPerceel?.id)}
            onRequest={() => {
              if (userPlan === 'pro') {
                setCurrentScreen('opgeslagen-aanvraag');
              } else {
                setCurrentScreen('opgeslagen-geen-toegang');
              }
            }}
            onCancelAanvraag={(aanvraagId) => {
              showConfirm({
                title: 'Aanvraag annuleren',
                message: 'Weet je zeker dat je deze aanvraag wilt annuleren?',
                confirmLabel: 'Annuleer aanvraag',
                onConfirm: async () => {
                  try {
                    const { error } = await supabase
                      .from('aanvragen')
                      .update({ status: 'cancelled' })
                      .eq('id', aanvraagId);
                    if (error) throw error;
                    setProfielRefreshKey((k) => k + 1);
                    setSelectedSavedPerceel(null);
                    setCurrentScreen(opgeslagenSource || 'home');
                    showToast('Aanvraag geannuleerd', 'success');
                  } catch (e) {
                    console.warn('cancel aanvraag failed', e);
                    showToast('Kon de aanvraag niet annuleren. Probeer opnieuw.', 'error');
                  }
                },
              });
            }}
            hasActiveSamenwerking={!!activeSamenwerking}
          />
        ) : currentScreen === 'opgeslagen' ? (
          <OpgeslagenScreen
            onBack={() => setCurrentScreen(opgeslagenSource)}
            onPerceelPress={(plot) => {
              setSelectedSavedPerceel(plot);
              setCurrentScreen('opgeslagen-detail');
            }}
          />
        ) : currentScreen === 'notificatie-instellingen' ? (
          <NotificatieInstellingenScreen
            onBack={() => setCurrentScreen('instellingen')}
          />
        ) : currentScreen === 'kies-plan' ? (
          <PlansScreen
            onBack={() => setCurrentScreen('instellingen')}
            onUpgradeSuccess={() => {
              setProfielRefreshKey((k) => k + 1);
            }}
            onDiscoverPercelen={() => {
              homeInitialTabRef.current = 'kaart';
              setCurrentScreen('home');
            }}
          />
        ) : currentScreen === 'wachtwoord-wijzigen' ? (
          <WachtwoordWijzigenScreen
            onBack={() => setCurrentScreen('instellingen')}
          />
        ) : currentScreen === 'instellingen' ? (
          <InstellingenScreen
            role={selectedRole}
            onBack={() => setCurrentScreen('profiel')}
            onOpenProfielBewerken={() => {
              setProfielBewerkenSource('instellingen');
              setCurrentScreen('profiel-bewerken');
            }}
            onOpenNotificaties={() => setCurrentScreen('notificatie-instellingen')}
            onOpenKiesPlan={() => setCurrentScreen('kies-plan')}
            onOpenWeeklyGoal={() => { setWeeklyGoalSource('instellingen'); setCurrentScreen('weekly-goal'); }}
            onOpenWachtwoordWijzigen={() => setCurrentScreen('wachtwoord-wijzigen')}
            onLogout={handleLogout}
          />
        ) : currentScreen === 'profiel-bewerken' ? (
          <ProfielBewerkenScreen
            onBack={() => setCurrentScreen(profielBewerkenSource)}
            onSaved={() => {
              setProfielRefreshKey((k) => k + 1);
              setCurrentScreen(profielBewerkenSource);
            }}
          />
        ) : currentScreen === 'profiel' ? (
          <ProfielScreen
            role={selectedRole}
            refreshKey={profielRefreshKey}
            onOpenEdit={() => {
              setProfielBewerkenSource('profiel');
              setCurrentScreen('profiel-bewerken');
            }}
            onOpenSettings={() => setCurrentScreen('instellingen')}
            onOpenSavedScreen={() => { setOpgeslagenSource('profiel'); setCurrentScreen('opgeslagen'); }}
            onPerceelPress={(plot) => {
              setOpgeslagenSource('profiel');
              setSelectedSavedPerceel(plot);
              setCurrentScreen('opgeslagen-detail');
            }}
            onAanvraagPerceelPress={(aanvraag) => {
              setSelectedProfielAanvraag(aanvraag);
              setCurrentScreen('profiel-aanvraag-detail');
            }}
            onOwnPerceelPress={(perceel) => {
              setSelectedProfielPerceel(perceel);
              setCurrentScreen('profiel-perceel-detail');
            }}
            onTabPress={(item) => {
              if (item.key === 'profiel') return;
              homeInitialTabRef.current = item.key;
              setHomeTabRequest(null);
              setCurrentScreen('home');
            }}
            profileImageSource={null}
            badgeCounts={{ verzoeken: verzoekenCount, berichten: unreadMessagesCount }}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenSamenwerking={(s) => { setDetailSamenwerking(s); setCurrentScreen('samenwerking-detail'); }}
            onSamenwerkingPerceelPress={(s) => {
              setSelectedSamenwerking(s);
              setCurrentScreen('profiel-samenwerking-perceel-detail');
            }}
          />
        ) : currentScreen === 'meldingen' ? (
          <MeldingenScreen
            role={selectedRole}
            notifications={notifications}
            isLoading={isLoadingNotifications}
            markAsRead={markNotificationAsRead}
            markAllAsRead={markAllNotificationsAsRead}
            onBack={() => {
              setHomeTabRequest(null);
              setCurrentScreen('home');
            }}
            onNavigateToAanvraag={handleNotificationNavigateToAanvraag}
            onNavigateToAanvraagConversation={handleNotificationNavigateToAanvraagConversation}
            onNavigateToAanvraagPerceel={handleNotificationNavigateToAanvraagPerceel}
            onNavigateToConversation={handleNotificationNavigateToConversation}
            onNavigateToBeeindigd={(aanvraagId) => {
              setBeeindigdAanvraagId(aanvraagId);
              setCurrentScreen('samenwerking-beeindigd');
            }}
          />
        ) : currentScreen === 'log-month' ? (
          <LogboekMonthScreen
            onBack={() => { setHomeTabRequest(null); setCurrentScreen('home'); }}
            onOpenLogDetail={(logId) => {
              setSelectedLogId(logId);
              setCurrentScreen('log-detail');
            }}
            aanvraagId={activeSamenwerking?.id}
          />
        ) : currentScreen === 'log-detail' && selectedLogId ? (
          <LogDetailScreen
            logId={selectedLogId}
            onBack={() => {
              setSelectedLogId(null);
              setHomeTabRequest(null);
              setCurrentScreen('home');
            }}
            onDeleted={() => {
              setSelectedLogId(null);
              setHomeTabRequest(null);
              setSamenwerkingRefreshKey((k) => k + 1);
              setCurrentScreen('home');
            }}
            onUpdated={() => {
              setSamenwerkingRefreshKey((k) => k + 1);
            }}
          />
        ) : currentScreen === 'opvolgingen' ? (
          <OpvolgingenScreen
            aanvraagId={activeSamenwerking?.id}
            refreshKey={opvolgingRefreshKey}
            onBack={() => { setHomeTabRequest(null); setCurrentScreen('home'); }}
            onNieuweOpvolging={() => setCurrentScreen('nieuwe-opvolging')}
          />
        ) : currentScreen === 'nieuwe-opvolging' ? (
          <NieuweOpvolgingScreen
            aanvraagId={activeSamenwerking?.id}
            onBack={() => setCurrentScreen('opvolgingen')}
            onSaved={() => {
              setOpvolgingRefreshKey((k) => k + 1);
              setCurrentScreen('opvolgingen');
            }}
          />
        ) : currentScreen === 'weekly-goal' ? (
          <WeeklyGoalScreen
            onBack={() => { setHomeTabRequest(null); setCurrentScreen(weeklyGoalSource); }}
            onSaved={() => {
              setHomeTabRequest(null);
              setSamenwerkingRefreshKey((k) => k + 1);
              setCurrentScreen(weeklyGoalSource);
            }}
          />
        ) : currentScreen === 'eind-samenwerking' && selectedSamenwerking ? (
          <EindSamenwerkingScreen
            samenwerking={selectedSamenwerking}
            mode={endingMode}
            onBack={() => {
              setCurrentScreen(endingMode === 'recipient' ? 'samenwerking-beeindigd' : 'home');
            }}
            onDone={() => {
              setSelectedSamenwerking(null);
              setEndingMode('initiator');
              setCurrentScreen('home');
              setNotificationsRefreshKey((k) => k + 1);
              setAanvragenRefreshKey((k) => k + 1);
              setSamenwerkingRefreshKey((k) => k + 1);
            }}
          />
        ) : currentScreen === 'samenwerking-beeindigd' && beeindigdAanvraagId ? (
          <SamenwerkingBeeindigdScreen
            aanvraagId={beeindigdAanvraagId}
            currentUserId={currentUserId}
            onBack={() => setCurrentScreen('home')}
            onGiveReview={(samenwerkingData) => {
              setSelectedSamenwerking(samenwerkingData);
              setEndingMode('recipient');
              setCurrentScreen('eind-samenwerking');
            }}
            onSkipReview={() => setCurrentScreen('home')}
          />
        ) : currentScreen === 'samenwerking-detail' && detailSamenwerking ? (
          selectedRole === 'tuinzoeker' ? (
            <SamenwerkingDetailScreen
              samenwerking={detailSamenwerking}
              onBack={() => { setDetailSamenwerking(null); setCurrentScreen('profiel'); }}
              onOpenConversation={handleOpenConversation}
              onEndSamenwerking={(enriched) => {
                setSelectedSamenwerking(enriched);
                setEndingMode('initiator');
                setCurrentScreen('eind-samenwerking');
              }}
            />
          ) : (
            <ParcelDetailScreen
              perceel={detailSamenwerking.percelen || detailSamenwerking.perceel}
              isOwner={true}
              samenwerking={{ ...detailSamenwerking, percelen: detailSamenwerking.percelen ?? detailSamenwerking.perceel ?? null }}
              onBack={() => { setDetailSamenwerking(null); setCurrentScreen('profiel'); }}
              onOpenConversation={(samenwerkingOrConv) => {
                if (samenwerkingOrConv?.conversation?.id) {
                  handleOpenConversation({
                    id: samenwerkingOrConv.conversation.id,
                    aanvraag_id: samenwerkingOrConv.id,
                    otherUser: samenwerkingOrConv.senderProfile,
                  });
                } else {
                  handleOpenConversation(samenwerkingOrConv);
                }
              }}
              onEndSamenwerking={(enriched) => {
                setSelectedSamenwerking(enriched);
                setEndingMode('initiator');
                setCurrentScreen('eind-samenwerking');
              }}
            />
          )
        ) : currentScreen === 'profiel-perceel-edit' && selectedProfielPerceel ? (
          <PerceelToevoegenScreen
            initialPerceel={selectedProfielPerceel}
            onBack={() => setCurrentScreen('profiel-perceel-detail')}
            onSaved={(saved) => {
              if (saved?.id) setSelectedProfielPerceel(saved);
              setProfielRefreshKey((k) => k + 1);
              setCurrentScreen('profiel-perceel-detail');
              showToast('Wijzigingen opgeslagen', 'success');
            }}
          />
        ) : currentScreen === 'profiel-perceel-detail' && selectedProfielPerceel ? (
          <ParcelDetailScreen
            perceel={selectedProfielPerceel}
            onBack={() => {
              setCurrentScreen('profiel');
              setSelectedProfielPerceel(null);
            }}
            isOwner
            onEdit={() => setCurrentScreen('profiel-perceel-edit')}
            onToggleVisibility={handleToggleProfielPerceel}
            onDelete={handleDeleteProfielPerceel}
          />
        ) : currentScreen === 'profiel-aanvraag-detail' && selectedProfielAanvraag ? (
          <ParcelDetailScreen
            perceel={selectedProfielAanvraag.perceel || {}}
            onBack={() => {
              setCurrentScreen('profiel');
              setSelectedProfielAanvraag(null);
            }}
            showFavoriteButton
            isFavorited={isFavorite(selectedProfielAanvraag.perceel?.id)}
            onToggleFavorite={() => toggleFavorite(selectedProfielAanvraag.perceel?.id)}
            onCancelAanvraag={(aanvraagId) => {
              showConfirm({
                title: 'Aanvraag annuleren',
                message: 'Weet je zeker dat je deze aanvraag wilt annuleren?',
                confirmLabel: 'Annuleer aanvraag',
                onConfirm: async () => {
                  try {
                    const { error } = await supabase
                      .from('aanvragen')
                      .update({ status: 'cancelled' })
                      .eq('id', aanvraagId);
                    if (error) throw error;
                    setProfielRefreshKey((k) => k + 1);
                    setSelectedProfielAanvraag(null);
                    setCurrentScreen('profiel');
                    showToast('Aanvraag geannuleerd', 'success');
                  } catch (e) {
                    console.warn('cancel aanvraag failed', e);
                    showToast('Kon de aanvraag niet annuleren. Probeer opnieuw.', 'error');
                  }
                },
              });
            }}
          />
        ) : currentScreen === 'profiel-samenwerking-perceel-detail' && selectedSamenwerking ? (
          <ParcelDetailScreen
            perceel={selectedSamenwerking.percelen || {}}
            onBack={() => {
              setSelectedSamenwerking(null);
              setCurrentScreen('profiel');
            }}
            samenwerking={selectedSamenwerking}
            onOpenConversation={(s) => {
              const conv = s?.conversation;
              if (conv?.id) {
                handleOpenConversation({
                  id: conv.id,
                  aanvraag_id: s.id,
                  owner_id: s.percelen?.owner_id,
                  sender_id: s.sender_id,
                  otherUser: s.ownerProfile || null,
                });
              }
            }}
            onEndSamenwerking={(s) => {
              setSelectedSamenwerking({
                ...s,
                conversationId: s.conversation?.id,
              });
              setEndingMode('initiator');
              setCurrentScreen('eind-samenwerking');
            }}
          />
        ) : selectedRole === 'tuineigenaar' ? (
          <TuineigenaarHomeScreen
            getInitialTab={() => { const t = homeInitialTabRef.current; homeInitialTabRef.current = 'start'; return t; }}
            onLogout={handleLogout}
            currentScreen={currentScreen}
            selectedAanvraag={selectedAanvraag}
            onViewAanvraag={handleViewAanvraag}
            onCloseAanvraag={handleCloseAanvraag}
            onAanvraagActionComplete={handleAanvraagActionComplete}
            aanvragenRefreshKey={aanvragenRefreshKey}
            badgeCounts={{ verzoeken: verzoekenCount, berichten: unreadMessagesCount }}
            onBadgeCountChange={setVerzoekenCount}
            onOpenConversation={handleOpenConversation}
            selectedConversation={selectedConversation}
            onCloseConversation={handleCloseConversation}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => setCurrentScreen('meldingen')}
            onOpenProfiel={() => setCurrentScreen('profiel')}
            requestedTab={homeTabRequest}
            onEndSamenwerking={(samenwerking) => {
              setSelectedSamenwerking(samenwerking);
              setEndingMode('initiator');
              setCurrentScreen('eind-samenwerking');
            }}
          />
        ) : activeSamenwerking && !isLoadingActiveSamenwerking ? (
          <LogboekHomeScreen
            samenwerking={activeSamenwerking}
            samenwerkingRefreshKey={samenwerkingRefreshKey}
            getInitialTab={() => { const t = homeInitialTabRef.current; homeInitialTabRef.current = 'start'; return t; }}
            badgeCounts={{ berichten: unreadMessagesCount }}
            onOpenConversation={handleOpenConversation}
            selectedConversation={selectedConversation}
            onCloseConversation={handleCloseConversation}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => setCurrentScreen('meldingen')}
            onOpenProfiel={() => setCurrentScreen('profiel')}
            onOpenSaved={() => { setOpgeslagenSource('home'); setCurrentScreen('opgeslagen'); }}
            onNieuweLogSaved={() => setSamenwerkingRefreshKey((k) => k + 1)}
            onOpenWeeklyGoal={() => { setWeeklyGoalSource('home'); setCurrentScreen('weekly-goal'); }}
            onOpenLogDetail={(logId) => { setSelectedLogId(logId); setCurrentScreen('log-detail'); }}
            onOpenMonth={() => setCurrentScreen('log-month')}
            onOpenOpvolgingen={() => setCurrentScreen('opvolgingen')}
            requestedTab={homeTabRequest}
            onEndSamenwerking={(enriched) => {
              setSelectedSamenwerking(enriched);
              setEndingMode('initiator');
              setCurrentScreen('eind-samenwerking');
            }}
          />
        ) : (
          <HomeScreen
            getInitialTab={() => { const t = homeInitialTabRef.current; homeInitialTabRef.current = 'start'; return t; }}
            requestedTab={homeTabRequest}
            onLogout={handleLogout}
            badgeCounts={{ berichten: unreadMessagesCount }}
            onOpenConversation={handleOpenConversation}
            selectedConversation={selectedConversation}
            onCloseConversation={handleCloseConversation}
            onConfirmSamenwerking={() => setSamenwerkingRefreshKey((k) => k + 1)}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => { setHomeTabRequest(null); setCurrentScreen('meldingen'); }}
            onOpenProfiel={() => setCurrentScreen('profiel')}
            onOpenSaved={() => { setOpgeslagenSource('home'); setCurrentScreen('opgeslagen'); }}
          />
        )
      ) : screen === 'login' ? (
        <LoginScreen
          onCreateAccount={() => setScreen('onboarding')}
          onLoginSuccess={(role) => {
            if (role) setSelectedRole(role);
            setIsLoggedIn(true);
          }}
          onForgotPassword={() => { setLastResetEmail(''); setScreen('passwordReset'); }}
        />
      ) : screen === 'passwordReset' ? (
        <PasswordResetScreen
          onBack={() => setScreen('login')}
          initialEmail={lastResetEmail}
          onSent={(email) => {
            setLastResetEmail(email || '');
            setScreen('passwordResetSent');
          }}
        />
      ) : screen === 'passwordResetSent' ? (
        <PasswordResetSentScreen
          email={lastResetEmail}
          onBack={() => setScreen('login')}
          onResend={() => setScreen('passwordReset')}
        />
      ) : screen === 'intro' ? (
        <IntroScreen
          onCreateAccount={() => setScreen('onboarding')}
          onSignIn={() => setScreen('login')}
        />
      ) : screen === 'onboarding' ? (
        <OnboardingContainer
          onComplete={() => setScreen('role')}
          onSkip={() => setScreen('role')}
        />
      ) : screen === 'role' ? (
        <RoleSelectionScreen
          onContinue={(roleId) => {
            setSelectedRole(roleId);
            setScreen('account');
          }}
          onLogin={() => setScreen('login')}
        />
      ) : screen === 'account' ? (
        <AccountDetailsScreen
          onBack={() => setScreen('role')}
          onLogin={() => setScreen('login')}
          onContinue={(data) => {
            setProfileDraft(data);
            setScreen('photo');
          }}
          initialValues={profileDraft ? {
            firstName: profileDraft.firstName,
            lastName: profileDraft.lastName,
            email: profileDraft.email,
            plaats: profileDraft.plaats,
          } : null}
        />
      ) : screen === 'photo' ? (
        <PhotoScreen
          onBack={() => setScreen('account')}
          onSkip={() => setScreen('cover')}
          onContinue={(uri) => {
            setProfilePhotoUri(uri || null);
            setScreen('cover');
          }}
          initialUri={profilePhotoUri}
        />
      ) : screen === 'cover' ? (
        <CoverPhotoScreen
          onBack={() => setScreen('photo')}
          onSkip={() => setScreen('bio')}
          onContinue={(uri) => {
            setCoverPhotoUri(uri || null);
            setScreen('bio');
          }}
          initialUri={coverPhotoUri}
        />
      ) : screen === 'bio' ? (
        <BioScreen
          onBack={(currentBio) => {
            setDraftBio(currentBio ?? '');
            setScreen('cover');
          }}
          onContinue={handleCompleteSignUp}
          isSubmitting={isSavingProfile}
          initialBio={draftBio}
        />
      ) : screen === 'welcome' ? (
        <WelcomeScreen
          email={signedUpEmail}
          emailVerificationRequired={needsEmailVerification}
          onConfirmed={() => setIsLoggedIn(true)}
          onGoToLogin={() => setScreen('login')}
        />
      ) : (
        <IntroScreen
          onCreateAccount={() => setScreen('onboarding')}
          onSignIn={() => setIsLoggedIn(true)}
        />
      )}
    </AppProviders>
  );
}