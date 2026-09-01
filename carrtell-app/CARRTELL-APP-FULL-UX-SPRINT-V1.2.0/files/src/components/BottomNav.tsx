import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppTab } from '../types/navigation';
import { colors } from '../theme/colors';

type Props = {
  activeTab: AppTab;
  cartCount: number;
  onChange: (tab: AppTab) => void;
};

const items: Array<{ key: AppTab; label: string; icon: string }> = [
  { key: 'home', label: 'خانه', icon: '⌂' },
  { key: 'shop', label: 'فروشگاه', icon: '▦' },
  { key: 'booking', label: 'رزرو', icon: '◆' },
  { key: 'cart', label: 'سبد', icon: '▣' },
  { key: 'profile', label: 'پروفایل', icon: '●' },
];

export default function BottomNav({ activeTab, cartCount, onChange }: Props) {
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
              style={[styles.item, active && styles.itemActive]}
            >
              <View style={[
                styles.iconWrap,
                booking && styles.bookingIconWrap,
                active && !booking && styles.iconWrapActive,
              ]}>
                <Text style={[styles.icon, booking && styles.bookingIcon, active && !booking && styles.iconActive]}>
                  {item.icon}
                </Text>
                {item.key === 'cart' && cartCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
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
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 8,
  },
  shell: {
    minHeight: 68,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 22,
    backgroundColor: '#0A1524',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  item: {
    minWidth: 55,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 14,
  },
  itemActive: {
    backgroundColor: '#122138',
  },
  iconWrap: {
    position: 'relative',
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#1A2C46',
  },
  bookingIconWrap: {
    width: 43,
    height: 43,
    marginTop: -16,
    borderRadius: 15,
    backgroundColor: colors.gold,
    borderWidth: 4,
    borderColor: colors.bg,
  },
  icon: {
    color: colors.muted,
    fontSize: 17,
    fontWeight: '900',
  },
  iconActive: {
    color: colors.goldSoft,
  },
  bookingIcon: {
    color: colors.bg,
  },
  label: {
    color: colors.muted,
    fontSize: 9.5,
    fontWeight: '750',
  },
  labelActive: {
    color: colors.text,
    fontWeight: '900',
  },
  badge: {
    position: 'absolute',
    top: -5,
    left: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A1524',
  },
  badgeText: {
    color: colors.white,
    fontSize: 7,
    fontWeight: '900',
  },
});
