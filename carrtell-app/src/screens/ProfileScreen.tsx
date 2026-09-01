import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { Vehicle } from '../types/models';

type Props = {
  vehicle: Vehicle | null;
  onSelectVehicle: () => void;
};

const rows = [
  ['سفارش‌های من', '▣'],
  ['رزروهای من', '◆'],
  ['خودروهای من', 'C'],
  ['آدرس‌های من', '⌾'],
  ['علاقه‌مندی‌ها', '♡'],
  ['کدهای تخفیف', '%'],
  ['پشتیبانی', '?'],
];

export default function ProfileScreen({ vehicle, onSelectVehicle }: Props) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHead}>
        <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>امین</Text>
          <Text style={styles.phone}>09xxxxxxxxx</Text>
        </View>
        <Pressable style={styles.editButton}><Text style={styles.editButtonText}>ویرایش</Text></Pressable>
      </View>

      <Pressable style={styles.vehicleCard} onPress={onSelectVehicle}>
        <View style={styles.vehicleIcon}><Text style={styles.vehicleIconText}>C</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.vehicleLabel}>خودروی فعال</Text>
          <Text style={styles.vehicleTitle}>{vehicle?.title || 'خودرو انتخاب نشده'}</Text>
          <Text style={styles.vehicleText}>{vehicle ? `${vehicle.oilGrade} • ${vehicle.oilVolume}` : 'برای پیشنهاد دقیق‌تر خودرو را انتخاب کن'}</Text>
        </View>
        <Text style={styles.vehicleArrow}>‹</Text>
      </Pressable>

      <View style={styles.menu}>
        {rows.map(([label, icon]) => (
          <Pressable key={label} style={styles.menuRow}>
            <View style={styles.menuIcon}><Text style={styles.menuIconText}>{icon}</Text></View>
            <Text style={styles.menuLabel}>{label}</Text>
            <Text style={styles.menuArrow}>‹</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logout}><Text style={styles.logoutText}>خروج از حساب</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 15, paddingBottom: 28, gap: 14 },

  profileHead: { minHeight: 86, flexDirection: 'row-reverse', alignItems: 'center', gap: 11 },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.bg, fontSize: 23, fontWeight: '900' },
  name: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'right' },
  phone: { marginTop: 3, color: colors.muted, fontSize: 9.5, textAlign: 'right' },
  editButton: { minWidth: 60, minHeight: 34, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSoft },
  editButtonText: { color: colors.cyan, fontSize: 8.5, fontWeight: '900' },

  vehicleCard: { minHeight: 84, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 12, borderRadius: 17, backgroundColor: '#0C1725', borderWidth: 1, borderColor: '#3A3213' },
  vehicleIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2A240E', alignItems: 'center', justifyContent: 'center' },
  vehicleIconText: { color: colors.gold, fontSize: 19, fontWeight: '900' },
  vehicleLabel: { color: colors.gold, fontSize: 8.5, fontWeight: '900', textAlign: 'right' },
  vehicleTitle: { marginTop: 2, color: colors.text, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  vehicleText: { marginTop: 3, color: colors.muted, fontSize: 8.5, textAlign: 'right' },
  vehicleArrow: { color: colors.mutedStrong, fontSize: 24 },

  menu: { overflow: 'hidden', borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  menuRow: { minHeight: 58, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  menuIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#101F33', alignItems: 'center', justifyContent: 'center' },
  menuIconText: { color: colors.goldSoft, fontSize: 13, fontWeight: '900' },
  menuLabel: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '800', textAlign: 'right' },
  menuArrow: { color: colors.muted, fontSize: 22 },

  logout: { minHeight: 46, borderRadius: 14, backgroundColor: '#2A1419', borderWidth: 1, borderColor: '#5C2732', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: colors.danger, fontSize: 10.5, fontWeight: '900' },
});
