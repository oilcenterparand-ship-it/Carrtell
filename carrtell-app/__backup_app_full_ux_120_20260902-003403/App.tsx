import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import BottomNav from './src/components/BottomNav';
import HomeScreen from './src/screens/HomeScreen';
import ShopScreen from './src/screens/ShopScreen';
import BookingScreen from './src/screens/BookingScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { colors } from './src/theme/colors';
import type { AppTab } from './src/types/navigation';

export default function App() {
  const [tab, setTab] = useState<AppTab>('home');

  const renderScreen = () => {
    switch (tab) {
      case 'shop':
        return <ShopScreen onGoCart={() => setTab('cart')} />;
      case 'booking':
        return <BookingScreen />;
      case 'cart':
        return <CartScreen onContinueShopping={() => setTab('shop')} />;
      case 'profile':
        return <ProfileScreen />;
      case 'home':
      default:
        return (
          <HomeScreen
            onGoShop={() => setTab('shop')}
            onGoBooking={() => setTab('booking')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.app}>{renderScreen()}</View>
      <BottomNav activeTab={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  app: { flex: 1 },
});
