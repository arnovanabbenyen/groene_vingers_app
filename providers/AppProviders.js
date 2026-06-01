import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { FONT_ASSETS } from '../components/theme/fonts';
import { ToastProvider } from '../components/common/Toast';
import { ConfirmDialogProvider } from '../components/common/ConfirmDialog';

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
      <SafeAreaProvider>
        <ToastProvider>
          <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}