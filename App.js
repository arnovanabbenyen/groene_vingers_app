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
import ProfielBewerkenScreen from './screens/profile/ProfielBewerkenScreen';
import InstellingenScreen from './screens/settings/InstellingenScreen';
import NotificatieInstellingenScreen from './screens/settings/NotificatieInstellingenScreen';
import PlansScreen from './screens/plans/PlansScreen';
import EindSamenwerkingScreen from './screens/samenwerking/EindSamenwerkingScreen';
import SamenwerkingBeeindigdScreen from './screens/samenwerking/SamenwerkingBeeindigdScreen';
import SamenwerkingDetailScreen from './screens/samenwerking/SamenwerkingDetailScreen';
import { getEndedSamenwerking } from './services/samenwerkingProposal';
import LogboekHomeScreen from './screens/loggen/LogboekHomeScreen';
import NieuweLogScreen from './screens/loggen/NieuweLogScreen';
import LogDetailScreen from './screens/loggen/LogDetailScreen';
import LogboekMonthScreen from './screens/loggen/LogboekMonthScreen';
import OpvolgingenScreen from './screens/loggen/OpvolgingenScreen';
import NieuweOpvolgingScreen from './screens/loggen/NieuweOpvolgingScreen';
import WeeklyGoalScreen from './screens/settings/WeeklyGoalScreen';
import { usePendingAanvragen } from './hooks/usePendingAanvragen';
import { useNotifications } from './hooks/useNotifications';
import { useActiveSamenwerking } from './hooks/useActiveSamenwerking';
import OnboardingContainer from './screens/auth/OnboardingContainer';
import RoleSelectionScreen from './screens/auth/RoleSelectionScreen';
import AccountDetailsScreen from './screens/auth/AccountDetailsScreen';
import PhotoScreen from './screens/auth/PhotoScreen';
import CoverPhotoScreen from './screens/auth/CoverPhotoScreen';
import BioScreen from './screens/auth/BioScreen';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import { supabase } from './services/supabase';

export default function App() {
  const [notificationsRefreshKey, setNotificationsRefreshKey] = useState(0);
  const { unreadCount: unreadNotificationsCount } = useNotifications(notificationsRefreshKey);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState('intro');
  const [selectedRole, setSelectedRole] = useState('tuinzoeker');
  const [verzoekenCount, setVerzoekenCount] = useState(0);
  const [aanvragenRefreshKey, setAanvragenRefreshKey] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('home');
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
  const [profielRefreshKey, setProfielRefreshKey] = useState(0);
  const [profielBewerkenSource, setProfielBewerkenSource] = useState('profiel');
  const [selectedSavedPerceel, setSelectedSavedPerceel] = useState(null);
  const [opgeslagenSource, setOpgeslagenSource] = useState('home');
  const [selectedSamenwerking, setSelectedSamenwerking] = useState(null);
  const [samenwerkingRefreshKey, setSamenwerkingRefreshKey] = useState(0);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [endingMode, setEndingMode] = useState('initiator');
  const [beeindigdAanvraagId, setBeeindigdAanvraagId] = useState(null);
  const [detailSamenwerking, setDetailSamenwerking] = useState(null);
  const [weeklyGoalSource, setWeeklyGoalSource] = useState('instellingen');
  const [opvolgingRefreshKey, setOpvolgingRefreshKey] = useState(0);
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
      await supabase.from('profiles').update({ [field]: publicUrl }).eq('id', userId);
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
      }

      setScreen('welcome');
    } catch (err) {
      Alert.alert('Account aanmaken mislukt', err.message || 'Probeer het opnieuw.');
    } finally {
      setIsSavingProfile(false);
    }
  }

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
          .select('id')
          .or(`owner_id.eq.${userId},sender_id.eq.${userId}`);

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

  function handleOpenConversation(conversation) {
    setSelectedConversation(conversation);
    setCurrentScreen('conversation-detail');
  }

  function handleCloseConversation() {
    setSelectedConversation(null);
    setCurrentScreen('berichten');
    setConversationsRefreshKey((current) => current + 1);
  }


  // Handle deep links (groenevingers://) that carry auth callbacks from email confirmation
  useEffect(() => {
    if (!supabase) return;

    async function handleUrl(url) {
      if (!url) return;
      if (!url.includes('access_token') && !url.includes('code=')) return;
      try {
        await supabase.auth.exchangeCodeForSession(url);
        // onAuthStateChange fires SIGNED_IN → sets isLoggedIn(true) automatically
      } catch (err) {
        console.warn('Deep link auth exchange failed', err);
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
      }
    }

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        const user = session?.user;
        const role = user?.user_metadata?.role;
        if (role) setSelectedRole(role);
        if (user?.id) setCurrentUserId(user.id);
        setIsLoggedIn(true);
        setSamenwerkingRefreshKey((k) => k + 1);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setSelectedRole('tuinzoeker');
        setCurrentUserId(null);
        setCurrentScreen('home');
        setSelectedAanvraag(null);
        setSelectedAanvraagSource('home');
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
        currentScreen === 'opgeslagen-detail' ? (
          <ParcelDetailScreen
            perceel={selectedSavedPerceel || {}}
            onBack={() => {
              setCurrentScreen('opgeslagen');
              setSelectedSavedPerceel(null);
            }}
            showFavoriteButton
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
              setCurrentScreen('instellingen');
            }}
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
              setSelectedSavedPerceel(plot);
              setCurrentScreen('opgeslagen-detail');
            }}
            onTabPress={(item) => {
              if (item.key === 'profiel') return;
              homeInitialTabRef.current = item.key;
              setCurrentScreen('home');
            }}
            profileImageSource={null}
            badgeCounts={{ berichten: unreadMessagesCount }}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenSamenwerking={(s) => { setDetailSamenwerking(s); setCurrentScreen('samenwerking-detail'); }}
          />
        ) : currentScreen === 'meldingen' ? (
          <MeldingenScreen
            role={selectedRole}
            onBack={() => {
              setCurrentScreen('home');
              setNotificationsRefreshKey((k) => k + 1);
            }}
            onNavigateToHome={() => {
              setCurrentScreen('home');
              setNotificationsRefreshKey((k) => k + 1);
            }}
            onNavigateToAanvraag={() => {
              setCurrentScreen('home');
              setNotificationsRefreshKey((k) => k + 1);
            }}
            onNavigateToConversation={() => {
              setCurrentScreen('home');
              setNotificationsRefreshKey((k) => k + 1);
            }}
            onNavigateToBeeindigd={(aanvraagId) => {
              setBeeindigdAanvraagId(aanvraagId);
              setCurrentScreen('samenwerking-beeindigd');
            }}
          />
        ) : currentScreen === 'log-month' ? (
          <LogboekMonthScreen
            onBack={() => setCurrentScreen('home')}
            onOpenLogDetail={(logId) => {
              setSelectedLogId(logId);
              setCurrentScreen('log-detail');
            }}
          />
        ) : currentScreen === 'log-detail' && selectedLogId ? (
          <LogDetailScreen
            logId={selectedLogId}
            onBack={() => {
              setSelectedLogId(null);
              setCurrentScreen('home');
            }}
            onDeleted={() => {
              setSelectedLogId(null);
              setSamenwerkingRefreshKey((k) => k + 1);
              setCurrentScreen('home');
            }}
            onUpdated={() => {
              setSamenwerkingRefreshKey((k) => k + 1);
            }}
          />
        ) : currentScreen === 'nieuwe-log' ? (
          <NieuweLogScreen
            onBack={() => setCurrentScreen('home')}
            samenwerking={activeSamenwerking}
            onSaved={() => {
              setSamenwerkingRefreshKey((k) => k + 1);
              setCurrentScreen('home');
            }}
          />
        ) : currentScreen === 'opvolgingen' ? (
          <OpvolgingenScreen
            aanvraagId={activeSamenwerking?.id}
            refreshKey={opvolgingRefreshKey}
            onBack={() => setCurrentScreen('home')}
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
            onBack={() => setCurrentScreen(weeklyGoalSource)}
            onSaved={() => {
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
          <SamenwerkingDetailScreen
            samenwerking={detailSamenwerking}
            onBack={() => { setDetailSamenwerking(null); setCurrentScreen('profiel'); }}
            onOpenConversation={(conv) => handleOpenConversation(conv)}
            onEndSamenwerking={(enriched) => {
              setSelectedSamenwerking(enriched);
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
            onEndSamenwerking={(samenwerking) => {
              setSelectedSamenwerking(samenwerking);
              setCurrentScreen('eind-samenwerking');
            }}
          />
        ) : activeSamenwerking && !isLoadingActiveSamenwerking ? (
          <LogboekHomeScreen
            samenwerking={activeSamenwerking}
            samenwerkingRefreshKey={samenwerkingRefreshKey}
            badgeCounts={{ berichten: unreadMessagesCount }}
            onOpenConversation={handleOpenConversation}
            selectedConversation={selectedConversation}
            onCloseConversation={handleCloseConversation}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => setCurrentScreen('meldingen')}
            onOpenProfiel={() => setCurrentScreen('profiel')}
            onOpenSaved={() => { setOpgeslagenSource('home'); setCurrentScreen('opgeslagen'); }}
            onOpenNieuweLog={() => setCurrentScreen('nieuwe-log')}
            onOpenWeeklyGoal={() => { setWeeklyGoalSource('home'); setCurrentScreen('weekly-goal'); }}
            onOpenLogDetail={(logId) => { setSelectedLogId(logId); setCurrentScreen('log-detail'); }}
            onOpenMonth={() => setCurrentScreen('log-month')}
            onOpenOpvolgingen={() => setCurrentScreen('opvolgingen')}
          />
        ) : (
          <HomeScreen
            getInitialTab={() => { const t = homeInitialTabRef.current; homeInitialTabRef.current = 'start'; return t; }}
            onLogout={handleLogout}
            badgeCounts={{ berichten: unreadMessagesCount }}
            onOpenConversation={handleOpenConversation}
            selectedConversation={selectedConversation}
            onCloseConversation={handleCloseConversation}
            onConfirmSamenwerking={() => setSamenwerkingRefreshKey((k) => k + 1)}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => setCurrentScreen('meldingen')}
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
          onForgotPassword={() => setScreen('passwordReset')}
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