import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppTab } from '../types/navigation';
import { colors } from '../theme/colors';

type Props = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

const items: Array<{ key: AppTab; label: string; icon: string }> = [
  { key: 'home', label: 'خانه', icon: '⌂' },
  { key: 'shop', label: 'فروشگاه', icon: '▦' },
  { key: 'booking', label: 'رزرو', icon: '◉' },
  { key: 'cart', label: 'سبد', icon: '▣' },
  { key: 'profile', label: 'پروفایل', icon: '●' },
];

export default function BottomNav({ activeTab, onChange }: Props) {
  return (
    <View style={styles.shell}>
      {items.map((item) => {
        const active = item.key === activeTab;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{item.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 72,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#091421',
  },
  item: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    borderRadius: 14,
  },
  itemActive: { backgroundColor: '#17253A' },
  icon: { color: colors.muted, fontSize: 20, fontWeight: '900' },
  iconActive: { color: colors.gold },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  labelActive: { color: colors.text },
});
