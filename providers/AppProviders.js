import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FONT_ASSETS } from '../components/theme/fonts';

export default function AppProviders({ children }) {
  const [fontsLoaded] = useFonts(FONT_ASSETS);

  if (!fontsLoaded) {
    return null;
  }

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}