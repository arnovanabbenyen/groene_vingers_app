import React, { useState } from 'react';
import AppProviders from './providers/AppProviders';
import IntroScreen from './screens/intro/IntroScreen';
import HomeScreen from './screens/home/HomeScreen';
import InfoScreen from './screens/auth/InfoScreen';
import InfoScreen2 from './screens/auth/InfoScreen2';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState('intro');

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
      ) : (
        <IntroScreen
          onCreateAccount={() => setScreen('info')}
          onSignIn={() => setIsLoggedIn(true)}
        />
      )}
    </AppProviders>
  );
}
