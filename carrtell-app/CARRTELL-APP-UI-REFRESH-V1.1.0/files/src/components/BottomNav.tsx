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
  { key: 'booking', label: 'رزرو', icon: '◆' },
  { key: 'cart', label: 'سبد', icon: '▣' },
  { key: 'profile', label: 'پروفایل', icon: '●' },
];

export default function BottomNav({ activeTab, onChange }: Props) {
  return (
    <View style={styles.safe}>
      <View style={styles.shell}>
        {items.map((item) => {
          const active = item.key === activeTab;
          const booking = item.key === 'booking';

          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              style={[
                styles.item,
                active && styles.itemActive,
                booking && styles.bookingItem,
                booking && active && styles.bookingItemActive,
              ]}
            >
              <View style={[
                styles.iconWrap,
                active && styles.iconWrapActive,
                booking && styles.bookingIconWrap,
              ]}>
                <Text style={[
                  styles.icon,
                  active && styles.iconActive,
                  booking && styles.bookingIcon,
                ]}>
                  {item.icon}
                </Text>
              </View>
              <Text style={[
                styles.label,
                active && styles.labelActive,
                booking && styles.bookingLabel,
              ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 9,
  },
  shell: {
    minHeight: 70,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 24,
    backgroundColor: '#0A1524',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  item: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 16,
  },
  itemActive: {
    backgroundColor: '#14243A',
  },
  bookingItem: {
    marginTop: -18,
    backgroundColor: '#0A1524',
    paddingHorizontal: 4,
  },
  bookingItemActive: {
    backgroundColor: 'transparent',
  },
  iconWrap: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#1B2C45',
  },
  bookingIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.gold,
    borderWidth: 4,
    borderColor: colors.bg,
    shadowColor: colors.gold,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 10,
  },
  icon: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '900',
  },
  iconActive: {
    color: colors.goldSoft,
  },
  bookingIcon: {
    color: colors.bg,
    fontSize: 18,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.text,
    fontWeight: '900',
  },
  bookingLabel: {
    color: colors.text,
    fontWeight: '900',
  },
});
