import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AppProviders from './providers/AppProviders';
import IntroScreen from './screens/intro/IntroScreen';
import HomeScreen from './screens/home/HomeScreen';
import LoginScreen from './screens/auth/LoginScreen';
import PasswordResetScreen from './screens/auth/PasswordResetScreen';
import PasswordResetSentScreen from './screens/auth/PasswordResetSentScreen';
import TuineigenaarHomeScreen from './screens/home/TuineigenaarHomeScreen';
import InfoScreen from './screens/auth/InfoScreen';
import InfoScreen2 from './screens/auth/InfoScreen2';
import InfoScreen3 from './screens/auth/InfoScreen3';
import RoleSelectionScreen from './screens/auth/RoleSelectionScreen';
import AccountDetailsScreen from './screens/auth/AccountDetailsScreen';
import PhotoScreen from './screens/auth/PhotoScreen';
import BioScreen from './screens/auth/BioScreen';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import { supabase } from './services/supabase';
 
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState('intro');
  const [selectedRole, setSelectedRole] = useState('tuinzoeker');
  const [profileDraft, setProfileDraft] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [lastResetEmail, setLastResetEmail] = useState('');

  useEffect(() => {
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
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setSelectedRole('tuinzoeker');
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
        selectedRole === 'tuineigenaar' ? (
          <TuineigenaarHomeScreen onLogout={() => setIsLoggedIn(false)} />
        ) : (
          <HomeScreen onLogout={() => setIsLoggedIn(false)} />
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
          onSkip={() => setScreen('intro')}
          onContinue={() => setScreen('info2')}
        />
      ) : screen === 'info2' ? (
        <InfoScreen2
          onSkip={() => setScreen('intro')}
          onContinue={() => setScreen('info3')}
        />
      ) : screen === 'info3' ? (
        <InfoScreen3
          onSkip={() => setScreen('intro')}
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
          onSkip={() => setScreen('intro')}
          onContinue={() => setScreen('bio')}
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