import { StatusBar } from 'expo-status-bar';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';
import BottomNav from './src/components/BottomNav';
import HomeScreen from './src/screens/HomeScreen';
import ShopScreen from './src/screens/ShopScreen';
import BookingScreen from './src/screens/BookingScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { colors } from './src/theme/colors';
import type { AppTab } from './src/types/navigation';
import type { CartLine, Product, Vehicle } from './src/types/models';
import { defaultVehicle } from './src/services/mockData';

export default function App() {
  const [tab, setTab] = useState<AppTab>('home');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);

  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);

  const getQuantity = (productId: string) =>
    cart.find((line) => line.product.id === productId)?.quantity ?? 0;

  const addProduct = (product: Product) => {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const increment = (productId: string) => {
    setCart((current) =>
      current.map((line) =>
        line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line,
      ),
    );
  };

  const decrement = (productId: string) => {
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId ? { ...line, quantity: line.quantity - 1 } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const chooseVehicle = () => {
    setVehicle(defaultVehicle);
    Alert.alert('خودرو انتخاب شد', `${defaultVehicle.title} به‌عنوان خودروی فعال انتخاب شد.`);
  };

  const renderScreen = () => {
    switch (tab) {
      case 'shop':
        return (
          <ShopScreen
            vehicle={vehicle}
            getQuantity={getQuantity}
            onAddProduct={addProduct}
            onSelectVehicle={chooseVehicle}
          />
        );
      case 'booking':
        return <BookingScreen vehicle={vehicle} onSelectVehicle={chooseVehicle} />;
      case 'cart':
        return (
          <CartScreen
            lines={cart}
            onIncrement={increment}
            onDecrement={decrement}
            onContinueShopping={() => setTab('shop')}
          />
        );
      case 'profile':
        return <ProfileScreen vehicle={vehicle} onSelectVehicle={chooseVehicle} />;
      case 'home':
      default:
        return (
          <HomeScreen
            vehicle={vehicle}
            cartCount={cartCount}
            getQuantity={getQuantity}
            onSelectVehicle={chooseVehicle}
            onGoShop={() => setTab('shop')}
            onGoBooking={() => setTab('booking')}
            onGoCart={() => setTab('cart')}
            onAddProduct={addProduct}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.app}>{renderScreen()}</View>
      <BottomNav activeTab={tab} cartCount={cartCount} onChange={setTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  app: { flex: 1 },
});
