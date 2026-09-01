import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { categories, products } from '../services/mockData';
import type { Product, Vehicle } from '../types/models';
import ProductCard from '../components/ProductCard';
import { useMemo, useState } from 'react';

type Props = {
  vehicle: Vehicle | null;
  getQuantity: (productId: string) => number;
  onAddProduct: (product: Product) => void;
  onSelectVehicle: () => void;
};

export default function ShopScreen({ vehicle, getQuantity, onAddProduct, onSelectVehicle }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('همه');
  const [compatibleFirst, setCompatibleFirst] = useState(true);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((item) => {
      const byCategory = category === 'همه' || item.category === category;
      const byQuery = !q || `${item.brand} ${item.title} ${item.grade}`.toLowerCase().includes(q);
      return byCategory && byQuery;
    });

    if (compatibleFirst && vehicle) {
      list = [...list].sort((a, b) => Number(b.compatible) - Number(a.compatible));
    }

    return list;
  }, [query, category, compatibleFirst, vehicle]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>فروشگاه</Text>
        <Text style={styles.subtitle}>محصولات تخصصی خودرو با فیلتر سریع و خرید ساده</Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="جستجوی روغن، فیلتر، برند..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          textAlign="right"
        />
      </View>

      <Pressable style={styles.vehicleStrip} onPress={onSelectVehicle}>
        <Text style={styles.vehicleAction}>تغییر خودرو</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.vehicleStripTitle}>{vehicle ? `مناسب ${vehicle.title}` : 'خودروی من'}</Text>
          <Text style={styles.vehicleStripText}>{vehicle ? 'محصولات سازگار بالاتر نمایش داده می‌شوند.' : 'برای پیشنهاد دقیق‌تر خودرو را انتخاب کن.'}</Text>
        </View>
        <View style={styles.vehicleStripIcon}><Text style={styles.vehicleStripIconText}>C</Text></View>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categories.map((item) => {
          const active = item === category;
          return (
            <Pressable key={item} style={[styles.chip, active && styles.chipActive]} onPress={() => setCategory(item)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable style={styles.compatibleToggle} onPress={() => setCompatibleFirst((v) => !v)}>
        <View style={[styles.toggle, compatibleFirst && styles.toggleOn]}><View style={[styles.toggleDot, compatibleFirst && styles.toggleDotOn]} /></View>
        <Text style={styles.toggleText}>محصولات سازگار با خودروی من اول نمایش داده شوند</Text>
      </Pressable>

      <View style={styles.resultsHead}>
        <Text style={styles.resultsCount}>{visible.length} محصول</Text>
        <Text style={styles.resultsTitle}>نتایج فروشگاه</Text>
      </View>

      <View style={styles.grid}>
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getQuantity(product.id)}
            onAdd={onAddProduct}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 15, paddingBottom: 28, gap: 14 },
  header: { marginTop: 3 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  subtitle: { marginTop: 3, color: colors.muted, fontSize: 10, textAlign: 'right' },

  searchBox: { minHeight: 47, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  searchIcon: { color: colors.gold, fontSize: 18, fontWeight: '900' },
  input: { flex: 1, color: colors.text, fontSize: 12 },

  vehicleStrip: { minHeight: 78, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 12, borderRadius: 17, backgroundColor: '#0C1725', borderWidth: 1, borderColor: '#3A3213' },
  vehicleStripIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#2A240E', alignItems: 'center', justifyContent: 'center' },
  vehicleStripIconText: { color: colors.gold, fontSize: 18, fontWeight: '900' },
  vehicleStripTitle: { color: colors.text, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  vehicleStripText: { marginTop: 3, color: colors.muted, fontSize: 8.5, textAlign: 'right' },
  vehicleAction: { color: colors.gold, fontSize: 9, fontWeight: '900' },

  chips: { flexDirection: 'row-reverse', gap: 7 },
  chip: { minHeight: 35, paddingHorizontal: 13, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  chipActive: { backgroundColor: '#2A240E', borderColor: '#6A5613' },
  chipText: { color: colors.mutedStrong, fontSize: 9.5, fontWeight: '800' },
  chipTextActive: { color: colors.goldSoft },

  compatibleToggle: { minHeight: 42, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  toggle: { width: 38, height: 22, borderRadius: 11, padding: 3, backgroundColor: '#1A2738' },
  toggleOn: { backgroundColor: '#1E5A43' },
  toggleDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.muted },
  toggleDotOn: { backgroundColor: colors.success, alignSelf: 'flex-end' },
  toggleText: { color: colors.mutedStrong, fontSize: 9.5, fontWeight: '750' },

  resultsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultsTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  resultsCount: { color: colors.muted, fontSize: 9.5 },

  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
});
