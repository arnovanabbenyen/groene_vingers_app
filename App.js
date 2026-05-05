import React, { useState } from 'react';
import AppProviders from './providers/AppProviders';
import IntroScreen from './screens/intro/IntroScreen';
import HomeScreen from './screens/home/HomeScreen';
import InfoScreen from './screens/auth/InfoScreen';
import InfoScreen2 from './screens/auth/InfoScreen2';
import InfoScreen3 from './screens/auth/InfoScreen3';
import RoleSelectionScreen from './screens/auth/RoleSelectionScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState('intro');
  const [selectedRole, setSelectedRole] = useState('tuinzoeker');

  return (
    <AppProviders>
      {isLoggedIn ? (
        <HomeScreen onLogout={() => setIsLoggedIn(false)} />
      ) : screen === 'intro' ? (
        <IntroScreen
          onCreateAccount={() => setScreen('info')}
          onSignIn={() => setIsLoggedIn(true)}
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
          onLogin={() => setIsLoggedIn(true)}
          onContinue={() => setScreen('intro')}
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
