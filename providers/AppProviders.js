import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { FONT_ASSETS } from '../components/theme/fonts';

export default function AppProviders({ children }) {
  const [fontsLoaded] = useFonts(FONT_ASSETS);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY}
      merchantIdentifier="merchant.com.arnovan.groenevingers"
    >
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </StripeProvider>
  );
}