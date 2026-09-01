import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SectionHeader from '../components/SectionHeader';
import { colors } from '../theme/colors';

type Props = {
  onGoShop: () => void;
  onGoBooking: () => void;
};

const categories = ['روغن موتور', 'فیلترها', 'ضدیخ', 'واسکازین', 'گریس'];

export default function HomeScreen({ onGoShop, onGoBooking }: Props) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brand}>Carrtell</Text>
          <Text style={styles.brandFa}>کارتل</Text>
        </View>
        <View style={styles.logoMark}><Text style={styles.logoText}>C</Text></View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>فروش و سرویس تخصصی خودرو</Text>
        <Text style={styles.heroTitle}>محصول درست برای خودروت، سریع‌تر.</Text>
        <Text style={styles.heroText}>
          فروشگاه تخصصی روغن و فیلتر خودرو با امکان رزرو سرویس در محل.
        </Text>
        <View style={styles.heroActions}>
          <Pressable style={styles.primaryBtn} onPress={onGoShop}>
            <Text style={styles.primaryText}>ورود به فروشگاه</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onGoBooking}>
            <Text style={styles.secondaryText}>رزرو سرویس</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.carCard}>
        <View style={styles.carIcon}><Text style={styles.carIconText}>C</Text></View>
        <View style={styles.carCopy}>
          <Text style={styles.carTitle}>خودروی خودت را انتخاب کن</Text>
          <Text style={styles.carText}>پیشنهادهای سازگار با خودرو، دقیق‌تر و سریع‌تر.</Text>
        </View>
      </View>

      <SectionHeader title="دسته‌بندی‌های پرکاربرد" subtitle="دسترسی سریع به محصولات مصرفی خودرو" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
        {categories.map((item) => (
          <View key={item} style={styles.categoryCard}>
            <View style={styles.categoryDot} />
            <Text style={styles.categoryText}>{item}</Text>
          </View>
        ))}
      </ScrollView>

      <SectionHeader title="خرید سریع" subtitle="در Sprint بعدی این بخش به محصولات واقعی Supabase وصل می‌شود." />
      <View style={styles.productPreview}>
        {[1, 2].map((item) => (
          <View key={item} style={styles.productCard}>
            <View style={styles.productImage}><Text style={styles.productImageText}>OIL</Text></View>
            <Text style={styles.productBrand}>Carrtell Selection</Text>
            <Text style={styles.productName}>محصول پیشنهادی نمونه</Text>
            <View style={styles.productBottom}>
              <Text style={styles.productPrice}>— تومان</Text>
              <View style={styles.cartButton}><Text style={styles.cartButtonText}>+</Text></View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 28, gap: 18 },
  brandRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.text, fontSize: 25, fontWeight: '900', textAlign: 'right' },
  brandFa: { color: colors.gold, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  logoMark: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.bg, fontSize: 24, fontWeight: '900' },
  hero: { borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 22, gap: 10 },
  kicker: { color: colors.gold, textAlign: 'right', fontSize: 11, fontWeight: '800' },
  heroTitle: { color: colors.text, textAlign: 'right', fontSize: 28, lineHeight: 39, fontWeight: '900' },
  heroText: { color: colors.muted, textAlign: 'right', lineHeight: 22, fontSize: 13 },
  heroActions: { flexDirection: 'row-reverse', gap: 10, marginTop: 4 },
  primaryBtn: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.bg, fontWeight: '900', fontSize: 13 },
  secondaryBtn: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  carCard: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: '#0B1726', borderWidth: 1, borderColor: '#3A3317' },
  carIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A240C', borderWidth: 1, borderColor: '#6E5A13' },
  carIconText: { color: colors.gold, fontSize: 22, fontWeight: '900' },
  carCopy: { flex: 1, gap: 3 },
  carTitle: { color: colors.text, textAlign: 'right', fontSize: 15, fontWeight: '900' },
  carText: { color: colors.muted, textAlign: 'right', fontSize: 11, lineHeight: 18 },
  categoryRail: { flexDirection: 'row-reverse', gap: 10 },
  categoryCard: { width: 98, height: 104, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 10 },
  categoryDot: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#263148', borderWidth: 1, borderColor: '#7A6216' },
  categoryText: { color: colors.text, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  productPreview: { flexDirection: 'row-reverse', gap: 10 },
  productCard: { flex: 1, padding: 12, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 8 },
  productImage: { height: 110, borderRadius: 14, backgroundColor: '#F4F6F8', alignItems: 'center', justifyContent: 'center' },
  productImageText: { color: '#6A7480', fontSize: 22, fontWeight: '900' },
  productBrand: { color: colors.success, fontSize: 10, textAlign: 'right', fontWeight: '800' },
  productName: { color: colors.text, fontSize: 12, textAlign: 'right', lineHeight: 19, fontWeight: '800' },
  productBottom: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  productPrice: { color: colors.text, fontSize: 11, fontWeight: '800' },
  cartButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  cartButtonText: { color: colors.bg, fontSize: 20, fontWeight: '900' },
});
