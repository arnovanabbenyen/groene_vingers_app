import AppProviders from './providers/AppProviders';
import HomeScreen from './screens/home/HomeScreen';

export default function App() {
  return (
    <AppProviders>
      <HomeScreen />
    </AppProviders>
  );
}
