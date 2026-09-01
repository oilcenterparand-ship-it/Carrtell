import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { Product, Vehicle } from '../types/models';
import { products, popularBrands } from '../services/mockData';
import ProductCard from '../components/ProductCard';

type Props = {
  vehicle: Vehicle | null;
  cartCount: number;
  getQuantity: (productId: string) => number;
  onSelectVehicle: () => void;
  onGoShop: () => void;
  onGoBooking: () => void;
  onGoCart: () => void;
  onAddProduct: (product: Product) => void;
};

export default function HomeScreen({
  vehicle,
  cartCount,
  getQuantity,
  onSelectVehicle,
  onGoShop,
  onGoBooking,
  onGoCart,
  onAddProduct,
}: Props) {
  const suitable = products.filter((item) => item.compatible).slice(0, 4);
  const deals = products.filter((item) => item.oldPrice).slice(0, 4);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>C</Text></View>
        <View style={styles.headerCenter}>
          <Text style={styles.brand}>Carrtell</Text>
          <Text style={styles.brandCaption}>انتخاب درست برای خودرو</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.smallAction}><Text style={styles.smallActionText}>⌕</Text></View>
          <Pressable style={styles.smallAction} onPress={onGoCart}>
            <Text style={styles.smallActionText}>▣</Text>
            {cartCount > 0 ? (
              <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{cartCount}</Text></View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.vehicleCard} onPress={onSelectVehicle}>
        <View style={styles.vehicleIcon}><Text style={styles.vehicleIconText}>C</Text></View>
        <View style={styles.vehicleCopy}>
          {vehicle ? (
            <>
              <Text style={styles.vehicleLabel}>خودروی من</Text>
              <Text style={styles.vehicleTitle}>{vehicle.title}</Text>
              <Text style={styles.vehicleSubtitle}>{vehicle.subtitle} • روغن پیشنهادی {vehicle.oilGrade}</Text>
            </>
          ) : (
            <>
              <Text style={styles.vehicleLabel}>پیشنهاد هوشمند</Text>
              <Text style={styles.vehicleTitle}>خودروی خودت را انتخاب کن</Text>
              <Text style={styles.vehicleSubtitle}>تا محصولات سازگار را دقیق‌تر ببینی</Text>
            </>
          )}
        </View>
        <Text style={styles.vehicleArrow}>‹</Text>
      </Pressable>

      <View style={styles.primaryGrid}>
        <Pressable style={[styles.primaryCard, styles.primaryShop]} onPress={onGoShop}>
          <View style={styles.primaryIcon}><Text style={styles.primaryIconText}>▦</Text></View>
          <Text style={styles.primaryTitle}>خرید محصولات</Text>
          <Text style={styles.primarySubtitle}>روغن، فیلتر، ضدیخ و قطعات مصرفی</Text>
          <Text style={styles.primaryLink}>ورود به فروشگاه ←</Text>
        </Pressable>

        <Pressable style={[styles.primaryCard, styles.primaryService]} onPress={onGoBooking}>
          <View style={[styles.primaryIcon, styles.primaryIconBlue]}><Text style={[styles.primaryIconText, { color: colors.cyan }]}>◆</Text></View>
          <Text style={styles.primaryTitle}>سرویس در محل</Text>
          <Text style={styles.primarySubtitle}>تعویض روغن و سرویس در محل شما</Text>
          <Text style={[styles.primaryLink, { color: colors.cyan }]}>رزرو سریع ←</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionMore} onPress={onGoShop}>مشاهده همه</Text>
        <View>
          <Text style={styles.sectionTitle}>{vehicle ? `مناسب ${vehicle.title} شما` : 'محصولات پیشنهادی'}</Text>
          <Text style={styles.sectionSubtitle}>انتخاب‌های سریع برای خرید مطمئن‌تر</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRail}>
        {suitable.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getQuantity(product.id)}
            onAdd={onAddProduct}
          />
        ))}
      </ScrollView>

      <View style={styles.categoriesWrap}>
        {[
          ['روغن موتور', '◉', colors.gold],
          ['فیلترها', '≋', colors.cyan],
          ['ضدیخ', '◇', colors.success],
          ['واسکازین', '◆', colors.purple],
          ['گریس', '●', '#FF8A65'],
          ['مکمل‌ها', '✦', colors.pink],
        ].map(([label, icon, tint]) => (
          <Pressable key={String(label)} style={styles.categoryItem} onPress={onGoShop}>
            <View style={[styles.categoryIcon, { borderColor: String(tint) }]}>
              <Text style={[styles.categoryIconText, { color: String(tint) }]}>{icon}</Text>
            </View>
            <Text style={styles.categoryLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionMore} onPress={onGoShop}>همه پیشنهادها</Text>
        <View>
          <Text style={styles.sectionTitle}>پیشنهاد ویژه امروز</Text>
          <Text style={styles.sectionSubtitle}>محصولاتی که ارزش خرید بیشتری دارند</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRail}>
        {(deals.length ? deals : products.slice(0, 3)).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getQuantity(product.id)}
            onAdd={onAddProduct}
          />
        ))}
      </ScrollView>

      {vehicle ? (
        <View style={styles.vehicleDashboard}>
          <View style={styles.vehicleDashboardHead}>
            <View style={styles.vehicleDashboardIcon}><Text style={styles.vehicleDashboardIconText}>C</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleDashboardTitle}>{vehicle.title}</Text>
              <Text style={styles.vehicleDashboardSubtitle}>پیشنهادهای نگهداری بر اساس خودرو</Text>
            </View>
          </View>

          <View style={styles.vehicleMetrics}>
            <View style={styles.metric}><Text style={styles.metricValue}>{vehicle.oilGrade}</Text><Text style={styles.metricLabel}>روغن پیشنهادی</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{vehicle.oilVolume}</Text><Text style={styles.metricLabel}>حجم روغن</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{vehicle.filterCount}</Text><Text style={styles.metricLabel}>فیلتر سازگار</Text></View>
          </View>

          <Pressable style={styles.dashboardButton} onPress={onGoBooking}>
            <Text style={styles.dashboardButtonText}>رزرو سرویس بعدی</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>برندهای محبوب</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRail}>
        {popularBrands.map((brand) => (
          <View key={brand} style={styles.brandChip}><Text style={styles.brandChipText}>{brand}</Text></View>
        ))}
      </ScrollView>

      <View style={styles.reminderCard}>
        <View style={styles.reminderDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderTitle}>یادآوری سرویس</Text>
          <Text style={styles.reminderText}>بعداً تاریخچه سرویس و کیلومتر خودرو اینجا نمایش داده می‌شود.</Text>
        </View>
        <Pressable style={styles.reminderButton} onPress={onGoBooking}><Text style={styles.reminderButtonText}>رزرو</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 15, paddingTop: 8, paddingBottom: 28, gap: 17 },

  header: { minHeight: 54, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: colors.bg, fontSize: 21, fontWeight: '900' },
  headerCenter: { flex: 1 },
  brand: { color: colors.text, fontSize: 21, fontWeight: '900', textAlign: 'right' },
  brandCaption: { marginTop: 1, color: colors.muted, fontSize: 9.5, textAlign: 'right' },
  headerActions: { flexDirection: 'row', gap: 7 },
  smallAction: { position: 'relative', width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
  smallActionText: { color: colors.mutedStrong, fontSize: 16, fontWeight: '900' },
  headerBadge: { position: 'absolute', top: -5, left: -5, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  headerBadgeText: { color: colors.white, fontSize: 7, fontWeight: '900' },

  vehicleCard: { minHeight: 88, flexDirection: 'row-reverse', alignItems: 'center', gap: 11, padding: 13, borderRadius: 19, backgroundColor: '#0C1725', borderWidth: 1, borderColor: '#3B3212' },
  vehicleIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#29240E', borderWidth: 1, borderColor: '#6A5613' },
  vehicleIconText: { color: colors.gold, fontSize: 21, fontWeight: '900' },
  vehicleCopy: { flex: 1 },
  vehicleLabel: { color: colors.gold, fontSize: 8.5, fontWeight: '900', textAlign: 'right' },
  vehicleTitle: { marginTop: 2, color: colors.text, fontSize: 15.5, fontWeight: '900', textAlign: 'right' },
  vehicleSubtitle: { marginTop: 4, color: colors.muted, fontSize: 9.5, textAlign: 'right' },
  vehicleArrow: { color: colors.mutedStrong, fontSize: 26 },

  primaryGrid: { flexDirection: 'row-reverse', gap: 9 },
  primaryCard: { flex: 1, minHeight: 164, padding: 14, borderRadius: 20, borderWidth: 1 },
  primaryShop: { backgroundColor: '#17170F', borderColor: '#4B3D10' },
  primaryService: { backgroundColor: '#0D1828', borderColor: '#1C4267' },
  primaryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#2A230B', alignItems: 'center', justifyContent: 'center' },
  primaryIconBlue: { backgroundColor: '#0C2E4A' },
  primaryIconText: { color: colors.gold, fontSize: 17, fontWeight: '900' },
  primaryTitle: { marginTop: 12, color: colors.text, fontSize: 14.5, fontWeight: '900', textAlign: 'right' },
  primarySubtitle: { marginTop: 5, color: colors.muted, fontSize: 9.5, lineHeight: 16, textAlign: 'right' },
  primaryLink: { marginTop: 'auto', paddingTop: 10, color: colors.gold, fontSize: 9.5, fontWeight: '900', textAlign: 'right' },

  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'right' },
  sectionSubtitle: { marginTop: 3, color: colors.muted, fontSize: 9.5, textAlign: 'right' },
  sectionMore: { color: colors.gold, fontSize: 9, fontWeight: '850' },
  productRail: { flexDirection: 'row-reverse', gap: 10, paddingRight: 1 },

  categoriesWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9, justifyContent: 'space-between' },
  categoryItem: { width: '31%', minHeight: 94, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  categoryIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#091421' },
  categoryIconText: { fontSize: 17, fontWeight: '900' },
  categoryLabel: { color: colors.text, fontSize: 9.5, fontWeight: '800' },

  vehicleDashboard: { padding: 15, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  vehicleDashboardHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11 },
  vehicleDashboardIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  vehicleDashboardIconText: { color: colors.bg, fontSize: 20, fontWeight: '900' },
  vehicleDashboardTitle: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  vehicleDashboardSubtitle: { marginTop: 3, color: colors.muted, fontSize: 9, textAlign: 'right' },
  vehicleMetrics: { marginTop: 14, flexDirection: 'row-reverse', gap: 8 },
  metric: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#091421', borderWidth: 1, borderColor: colors.borderSoft },
  metricValue: { color: colors.text, fontSize: 12, fontWeight: '900' },
  metricLabel: { marginTop: 4, color: colors.muted, fontSize: 8 },
  dashboardButton: { marginTop: 12, minHeight: 42, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  dashboardButtonText: { color: colors.bg, fontSize: 10.5, fontWeight: '900' },

  brandRail: { flexDirection: 'row-reverse', gap: 8 },
  brandChip: { minWidth: 88, minHeight: 42, paddingHorizontal: 13, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  brandChipText: { color: colors.mutedStrong, fontSize: 10, fontWeight: '800' },

  reminderCard: { minHeight: 86, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 13, borderRadius: 18, backgroundColor: '#0C1725', borderWidth: 1, borderColor: '#23415A' },
  reminderDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.success },
  reminderTitle: { color: colors.text, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  reminderText: { marginTop: 3, color: colors.muted, fontSize: 8.5, lineHeight: 15, textAlign: 'right' },
  reminderButton: { minWidth: 58, minHeight: 34, borderRadius: 11, backgroundColor: '#133253', alignItems: 'center', justifyContent: 'center' },
  reminderButtonText: { color: colors.cyan, fontSize: 9.5, fontWeight: '900' },
});
