import React, { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
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
import LogboekHomeScreen from './screens/loggen/LogboekHomeScreen';
import NieuweLogScreen from './screens/loggen/NieuweLogScreen';
import WeeklyGoalScreen from './screens/settings/WeeklyGoalScreen';
import { usePendingAanvragen } from './hooks/usePendingAanvragen';
import { useNotifications } from './hooks/useNotifications';
import { useActiveSamenwerking } from './hooks/useActiveSamenwerking';
import InfoScreen from './screens/auth/InfoScreen';
import InfoScreen2 from './screens/auth/InfoScreen2';
import InfoScreen3 from './screens/auth/InfoScreen3';
import RoleSelectionScreen from './screens/auth/RoleSelectionScreen';
import AccountDetailsScreen from './screens/auth/AccountDetailsScreen';
import PhotoScreen from './screens/auth/PhotoScreen';
import BioScreen from './screens/auth/BioScreen';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import { supabase } from './services/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeBase64 } from 'base64-arraybuffer';

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
  const [profilePhotoUserId, setProfilePhotoUserId] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
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
  const [weeklyGoalSource, setWeeklyGoalSource] = useState('instellingen');
  const homeInitialTabRef = useRef('start');
  const { aanvragen: pendingAanvragen } = usePendingAanvragen(aanvragenRefreshKey);
  const {
    samenwerking: activeSamenwerking,
    isLoading: isSamenwerkingLoading,
    hasActiveSamenwerking,
  } = useActiveSamenwerking(samenwerkingRefreshKey);
  const pendingProfilePhotoRef = useRef({ uri: null, userId: null });

  function handleLogout() {
    setIsLoggedIn(false);
    setCurrentScreen('home');
    setSelectedAanvraag(null);
    setSelectedAanvraagSource('home');
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

  useEffect(() => {
    pendingProfilePhotoRef.current = {
      uri: profilePhotoUri,
      userId: profilePhotoUserId,
    };
  }, [profilePhotoUri, profilePhotoUserId]);

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

  async function uploadProfilePhoto(userId, photoUri) {
    const base64Encoding = FileSystem.EncodingType?.Base64 ?? 'base64';
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: base64Encoding,
    });
    const arrayBuffer = decodeBase64(base64);

    if (arrayBuffer.byteLength === 0) {
      throw new Error('Foto kon niet worden gelezen (0 bytes).');
    }

    const filePath = `${userId}/${Date.now()}.jpg`;
    console.log(`Uploading profile photo: ${arrayBuffer.byteLength} bytes to ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('profile-pfp')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile-pfp')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData?.publicUrl;
    console.log('Profile photo uploaded, URL:', avatarUrl);

    if (avatarUrl) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (updateError) {
        console.warn('Profile photo uploaded but avatar_url update failed:', updateError);
      }
    }

    return avatarUrl;
  }

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
            setIsLoggedIn(true);
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
        setIsLoggedIn(true);

        const pendingPhoto = pendingProfilePhotoRef.current;
        if (user?.id && pendingPhoto.uri && pendingPhoto.userId === user.id) {
          uploadProfilePhoto(user.id, pendingPhoto.uri)
            .then(() => {
              setProfilePhotoUri(null);
              setProfilePhotoUserId(null);
            })
            .catch((photoError) => {
              console.warn('Profile photo upload failed:', photoError);
              Alert.alert(
                'Foto kon niet worden opgeslagen',
                'Je account is aangemaakt, maar je profielfoto kon niet worden opgeslagen. Je kan dit later via je profiel doen.'
              );
            });
        }
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setSelectedRole('tuinzoeker');
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
 
  async function handleCompleteSignUp(bio) {
    if (!profileDraft?.email || !profileDraft?.password) {
      Alert.alert('Ontbrekende gegevens', 'Vul eerst je accountgegevens in.');
      setScreen('account');
      return;
    }

    if (!supabase) {
      Alert.alert('Supabase ontbreekt', 'Stel de Supabase omgeving in voordat je een account maakt.');
      return;
    }
 
    try {
      setIsSavingProfile(true);
 
      const metadata = {
        first_name: profileDraft.firstName || '',
        last_name: profileDraft.lastName || '',
        role: selectedRole,
        bio: bio || '',
      };
 
      const { data, error } = await supabase.auth.signUp({
        email: profileDraft.email,
        password: profileDraft.password,
        options: { data: metadata },
      });
 
      if (error) {
        throw error;
      }
 
      const createdUser = data?.user;
      if (!createdUser) {
        throw new Error('Account kon niet worden aangemaakt. Probeer opnieuw.');
      }

      if (profilePhotoUri) {
        pendingProfilePhotoRef.current = {
          uri: profilePhotoUri,
          userId: createdUser.id,
        };
        setProfilePhotoUserId(createdUser.id);
      }
 
      setProfileDraft(null);
 
      setRequiresEmailVerification(!data.session);
      setScreen('welcome');
    } catch (saveError) {
      Alert.alert('Opslaan mislukt', saveError.message || 'Er liep iets mis bij het opslaan van je gegevens.');
    } finally {
      setIsSavingProfile(false);
    }
  }
 
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
          />
        ) : currentScreen === 'nieuwe-log' ? (
          <NieuweLogScreen
            onBack={() => setCurrentScreen('home')}
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
            onBack={() => setCurrentScreen('home')}
            onDone={() => {
              setSelectedSamenwerking(null);
              setCurrentScreen('home');
              setNotificationsRefreshKey((k) => k + 1);
              setAanvragenRefreshKey((k) => k + 1);
              setSamenwerkingRefreshKey((k) => k + 1);
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
        ) : selectedRole === 'tuinzoeker' && !isSamenwerkingLoading && hasActiveSamenwerking ? (
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
            onNewLog={() => setCurrentScreen('nieuwe-log')}
            onOpenWeeklyGoal={() => { setWeeklyGoalSource('home'); setCurrentScreen('weekly-goal'); }}
          />
        ) : (
          <HomeScreen
            getInitialTab={() => { const t = homeInitialTabRef.current; homeInitialTabRef.current = 'start'; return t; }}
            onLogout={handleLogout}
            badgeCounts={{ berichten: unreadMessagesCount }}
            onOpenConversation={handleOpenConversation}
            selectedConversation={selectedConversation}
            onCloseConversation={handleCloseConversation}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => setCurrentScreen('meldingen')}
            onOpenProfiel={() => setCurrentScreen('profiel')}
            onOpenSaved={() => { setOpgeslagenSource('home'); setCurrentScreen('opgeslagen'); }}
          />
        )
      ) : screen === 'login' ? (
        <LoginScreen
          onCreateAccount={() => setScreen('info')}
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
          onCreateAccount={() => setScreen('info')}
          onSignIn={() => setScreen('login')}
        />
      ) : screen === 'info' ? (
        <InfoScreen
          onSkip={() => setScreen('role')}
          onContinue={() => setScreen('info2')}
        />
      ) : screen === 'info2' ? (
        <InfoScreen2
          onSkip={() => setScreen('role')}
          onContinue={() => setScreen('info3')}
        />
      ) : screen === 'info3' ? (
        <InfoScreen3
          onSkip={() => setScreen('role')}
          onContinue={() => setScreen('role')}
        />
      ) : screen === 'role' ? (
        <RoleSelectionScreen
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          onLogin={() => setScreen('intro')}
          onContinue={() => setScreen('account')}
        />
      ) : screen === 'account' ? (
        <AccountDetailsScreen
          role={selectedRole}
          onBack={() => setScreen('role')}
          onLogin={() => setScreen('login')}
          onContinue={(data) => {
            setProfileDraft(data);
            setScreen('photo');
          }}
        />
      ) : screen === 'photo' ? (
        <PhotoScreen
          onBack={() => setScreen('account')}
          onSkip={() => {
            setProfilePhotoUri(null);
            setScreen('bio');
          }}
          onContinue={(imageUri) => {
            setProfilePhotoUri(imageUri || null);
            setScreen('bio');
          }}
        />
      ) : screen === 'bio' ? (
        <BioScreen
          onBack={() => setScreen('photo')}
          onSkip={() => setScreen('intro')}
          isSubmitting={isSavingProfile}
          onContinue={handleCompleteSignUp}
        />
      ) : screen === 'welcome' ? (
        <WelcomeScreen
          emailVerificationRequired={requiresEmailVerification}
          onContinue={() => {
            if (requiresEmailVerification) {
              setScreen('intro');
              Alert.alert('Controleer je e-mail', 'Bevestig je account via de e-mail en log daarna in.');
            } else {
              setIsLoggedIn(true);
            }
          }}
        />
      ) : (
        <IntroScreen
          onCreateAccount={() => setScreen('info')}
          onSignIn={() => setIsLoggedIn(true)}
        />
      )}
    </AppProviders>
  );
}