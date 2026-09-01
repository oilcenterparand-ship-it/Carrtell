import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import SectionHeader from '../components/SectionHeader';
import { colors } from '../theme/colors';

export default function ShopScreen({ onGoCart, onContinueShopping }: { onGoCart?: () => void; onContinueShopping?: () => void }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader title="فروشگاه" subtitle="محصولات تخصصی خودرو" />
      <View style={styles.card}>
        <Text style={styles.title}>فروشگاه Carrtell</Text>
        <Text style={styles.text}>این بخش در Sprint بعدی به داده‌ها و API واقعی Carrtell متصل می‌شود.</Text>
      </View>
      {onGoCart ? (
        <Pressable style={styles.button} onPress={onGoCart}>
          <Text style={styles.buttonText}>مشاهده سبد خرید</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 30, gap: 16 },
  card: { minHeight: 210, padding: 20, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', gap: 8 },
  title: { color: colors.text, textAlign: 'right', fontSize: 20, fontWeight: '900' },
  text: { color: colors.muted, textAlign: 'right', fontSize: 12, lineHeight: 21 },
  button: { minHeight: 48, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.bg, fontSize: 13, fontWeight: '900' },
});
