import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SectionHeader from '../components/SectionHeader';
import { colors } from '../theme/colors';

type Props = {
  onGoShop: () => void;
  onGoBooking: () => void;
};

const categories = [
  { label: 'روغن موتور', symbol: '◉', tint: '#F5B700' },
  { label: 'فیلترها', symbol: '≋', tint: '#52C7FF' },
  { label: 'ضدیخ', symbol: '◇', tint: '#7DE2B8' },
  { label: 'واسکازین', symbol: '◆', tint: '#A78BFA' },
  { label: 'گریس', symbol: '●', tint: '#FF8A65' },
];

const quickActions = [
  { title: 'فروشگاه', subtitle: 'همه محصولات', symbol: '▦', tint: '#F5B700' },
  { title: 'پیشنهاد ویژه', subtitle: 'خرید به‌صرفه', symbol: '✦', tint: '#FF7A83' },
  { title: 'سرویس در محل', subtitle: 'رزرو سریع', symbol: '◆', tint: '#52C7FF' },
];

export default function HomeScreen({ onGoShop, onGoBooking }: Props) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <View style={styles.roundAction}><Text style={styles.roundActionText}>⌕</Text></View>
          <View style={styles.roundAction}><Text style={styles.roundActionText}>♡</Text></View>
        </View>

        <View style={styles.brandWrap}>
          <Text style={styles.brand}>Carrtell</Text>
          <Text style={styles.brandFa}>کارتل • انتخاب مطمئن خودرو</Text>
        </View>

        <View style={styles.logoMark}>
          <View style={styles.logoRing}>
            <Text style={styles.logoText}>C</Text>
          </View>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <View style={styles.heroSpeedLineOne} />
        <View style={styles.heroSpeedLineTwo} />

        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeDot}>●</Text>
          <Text style={styles.heroBadgeText}>فروش و سرویس تخصصی خودرو</Text>
        </View>

        <Text style={styles.heroTitle}>
          خرید برای خودروت،{'\n'}
          <Text style={styles.heroTitleGold}>سریع‌تر و دقیق‌تر.</Text>
        </Text>

        <Text style={styles.heroText}>
          محصول مناسب خودرو، پیشنهادهای کاربردی و رزرو سرویس در محل؛ همه در یک تجربه ساده.
        </Text>

        <View style={styles.heroActions}>
          <Pressable style={styles.primaryBtn} onPress={onGoShop}>
            <Text style={styles.primaryBtnIcon}>▦</Text>
            <Text style={styles.primaryText}>ورود به فروشگاه</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onGoBooking}>
            <Text style={styles.secondaryBtnIcon}>◆</Text>
            <Text style={styles.secondaryText}>رزرو سرویس</Text>
          </Pressable>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>+100</Text>
            <Text style={styles.heroStatLabel}>محصول تخصصی</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>سریع</Text>
            <Text style={styles.heroStatLabel}>مسیر خرید</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>مطمئن</Text>
            <Text style={styles.heroStatLabel}>انتخاب خودرو</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickGrid}>
        {quickActions.map((item, index) => (
          <Pressable
            key={item.title}
            style={[styles.quickCard, index === 0 && styles.quickCardPrimary]}
            onPress={index === 0 ? onGoShop : index === 2 ? onGoBooking : undefined}
          >
            <View style={[styles.quickIcon, { borderColor: item.tint }]}>
              <Text style={[styles.quickIconText, { color: item.tint }]}>{item.symbol}</Text>
            </View>
            <Text style={styles.quickTitle}>{item.title}</Text>
            <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.carCard}>
        <View style={styles.carCardAccent} />
        <View style={styles.carCardTop}>
          <View style={styles.carIcon}>
            <Text style={styles.carIconText}>C</Text>
            <View style={styles.carIconDot} />
          </View>
          <View style={styles.carCopy}>
            <Text style={styles.carEyebrow}>پیشنهاد دقیق‌تر</Text>
            <Text style={styles.carTitle}>خودروی خودت را انتخاب کن</Text>
            <Text style={styles.carText}>
              محصولات سازگار با خودروی شما اول نمایش داده می‌شوند.
            </Text>
          </View>
        </View>

        <View style={styles.carFooter}>
          <View style={styles.carHint}>
            <Text style={styles.carHintDot}>●</Text>
            <Text style={styles.carHintText}>بدون حذف سایر محصولات</Text>
          </View>
          <Pressable style={styles.carButton} onPress={onGoShop}>
            <Text style={styles.carButtonText}>انتخاب خودرو</Text>
            <Text style={styles.carButtonArrow}>←</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionMore}>مشاهده همه</Text>
        <SectionHeader
          title="دسته‌بندی‌های پرکاربرد"
          subtitle="چیزی که برای خودرو لازم داری، سریع‌تر پیدا کن"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRail}
      >
        {categories.map((item) => (
          <View key={item.label} style={styles.categoryCard}>
            <View style={[styles.categoryIconWrap, { borderColor: item.tint }]}>
              <View style={[styles.categoryIconGlow, { backgroundColor: item.tint }]} />
              <Text style={[styles.categorySymbol, { color: item.tint }]}>{item.symbol}</Text>
            </View>
            <Text style={styles.categoryText}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.offerHeader}>
        <View style={styles.offerBadge}><Text style={styles.offerBadgeText}>HOT</Text></View>
        <View style={styles.offerHeaderCopy}>
          <Text style={styles.offerTitle}>پیشنهادهای امروز</Text>
          <Text style={styles.offerSubtitle}>چند انتخاب خوب برای شروع خرید</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.offerRail}
      >
        <View style={[styles.offerCard, styles.offerCardGold]}>
          <View style={styles.offerCardTop}>
            <Text style={styles.offerCardTag}>پرفروش</Text>
            <View style={styles.offerVisualGold}><Text style={styles.offerVisualText}>OIL</Text></View>
          </View>
          <Text style={styles.offerCardTitle}>روغن موتور پیشنهادی</Text>
          <Text style={styles.offerCardText}>انتخاب سریع برای خرید روزمره</Text>
          <Pressable style={styles.offerCardButton} onPress={onGoShop}>
            <Text style={styles.offerCardButtonText}>مشاهده فروشگاه</Text>
          </Pressable>
        </View>

        <View style={[styles.offerCard, styles.offerCardBlue]}>
          <View style={styles.offerCardTop}>
            <Text style={styles.offerCardTag}>سرویس</Text>
            <View style={styles.offerVisualBlue}><Text style={styles.offerVisualText}>◆</Text></View>
          </View>
          <Text style={styles.offerCardTitle}>سرویس در محل</Text>
          <Text style={styles.offerCardText}>بدون مراجعه حضوری رزرو کن</Text>
          <Pressable style={styles.offerCardButtonBlue} onPress={onGoBooking}>
            <Text style={styles.offerCardButtonText}>رزرو سرویس</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.finalCta}>
        <View style={styles.finalCtaCopy}>
          <Text style={styles.finalCtaKicker}>Carrtell Experience</Text>
          <Text style={styles.finalCtaTitle}>فروشگاه کامل رو ببین</Text>
          <Text style={styles.finalCtaText}>محصولات بیشتر، مقایسه بهتر و مسیر خرید کامل.</Text>
        </View>
        <Pressable style={styles.finalCtaButton} onPress={onGoShop}>
          <Text style={styles.finalCtaButtonText}>بزن بریم</Text>
          <Text style={styles.finalCtaButtonArrow}>←</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 34,
    gap: 18,
  },

  header: {
    minHeight: 58,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  roundAction: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  roundActionText: {
    color: colors.mutedStrong,
    fontSize: 17,
    fontWeight: '900',
  },
  brandWrap: {
    flex: 1,
  },
  brand: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'right',
    letterSpacing: 0.2,
  },
  brandFa: {
    marginTop: 1,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
  },
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161F2D',
    borderWidth: 1,
    borderColor: '#3A2F0B',
  },
  logoRing: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  logoText: {
    color: colors.bg,
    fontSize: 20,
    fontWeight: '900',
  },

  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 360,
    padding: 22,
    borderRadius: 30,
    backgroundColor: '#0D1A2D',
    borderWidth: 1,
    borderColor: '#213B5B',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  heroGlowOne: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    top: -70,
    left: -55,
    backgroundColor: '#123E6B',
    opacity: 0.38,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    bottom: -65,
    right: -30,
    backgroundColor: '#8A5C00',
    opacity: 0.2,
  },
  heroSpeedLineOne: {
    position: 'absolute',
    width: 150,
    height: 3,
    top: 58,
    left: -20,
    borderRadius: 2,
    backgroundColor: colors.gold,
    opacity: 0.16,
    transform: [{ rotate: '-12deg' }],
  },
  heroSpeedLineTwo: {
    position: 'absolute',
    width: 115,
    height: 2,
    top: 78,
    left: 5,
    borderRadius: 2,
    backgroundColor: colors.cyan,
    opacity: 0.14,
    transform: [{ rotate: '-12deg' }],
  },
  heroBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: '#17263A',
    borderWidth: 1,
    borderColor: '#2A3E58',
  },
  heroBadgeDot: {
    color: colors.gold,
    fontSize: 8,
  },
  heroBadgeText: {
    color: colors.mutedStrong,
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    marginTop: 20,
    color: colors.text,
    textAlign: 'right',
    fontSize: 31,
    lineHeight: 44,
    fontWeight: '900',
  },
  heroTitleGold: {
    color: colors.goldSoft,
  },
  heroText: {
    marginTop: 10,
    maxWidth: '92%',
    alignSelf: 'flex-end',
    color: colors.mutedStrong,
    textAlign: 'right',
    lineHeight: 23,
    fontSize: 12.5,
  },
  heroActions: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 21,
  },
  primaryBtn: {
    flex: 1.15,
    minHeight: 49,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 15,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryBtnIcon: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '900',
  },
  primaryText: {
    color: colors.bg,
    fontWeight: '900',
    fontSize: 13,
  },
  secondaryBtn: {
    flex: 0.9,
    minHeight: 49,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2D425E',
    backgroundColor: '#122239',
  },
  secondaryBtnIcon: {
    color: colors.cyan,
    fontSize: 13,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '850',
    fontSize: 12.5,
  },
  heroStats: {
    minHeight: 58,
    marginTop: 23,
    paddingHorizontal: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 18,
    backgroundColor: '#091423',
    borderWidth: 1,
    borderColor: '#17283D',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  heroStatValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: colors.muted,
    fontSize: 8.5,
    fontWeight: '700',
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#203249',
  },

  quickGrid: {
    flexDirection: 'row-reverse',
    gap: 9,
  },
  quickCard: {
    flex: 1,
    minHeight: 108,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  quickCardPrimary: {
    borderColor: '#4C3C0B',
    backgroundColor: '#151B20',
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#0A1421',
  },
  quickIconText: {
    fontSize: 16,
    fontWeight: '900',
  },
  quickTitle: {
    marginTop: 11,
    color: colors.text,
    fontSize: 11.5,
    fontWeight: '900',
    textAlign: 'right',
  },
  quickSubtitle: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 8.5,
    textAlign: 'right',
  },

  carCard: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
    padding: 17,
    borderRadius: 24,
    backgroundColor: '#0C1725',
    borderWidth: 1,
    borderColor: '#3E3412',
  },
  carCardAccent: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    right: -18,
    top: -18,
    backgroundColor: colors.gold,
    opacity: 0.07,
  },
  carCardTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 13,
  },
  carIcon: {
    position: 'relative',
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#24200E',
    borderWidth: 1,
    borderColor: '#6B5714',
  },
  carIconText: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '900',
  },
  carIconDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    right: 6,
    bottom: 6,
    backgroundColor: colors.success,
  },
  carCopy: {
    flex: 1,
  },
  carEyebrow: {
    color: colors.gold,
    textAlign: 'right',
    fontSize: 9,
    fontWeight: '900',
  },
  carTitle: {
    marginTop: 3,
    color: colors.text,
    textAlign: 'right',
    fontSize: 17,
    fontWeight: '900',
  },
  carText: {
    marginTop: 5,
    color: colors.mutedStrong,
    textAlign: 'right',
    fontSize: 10.5,
    lineHeight: 18,
  },
  carFooter: {
    marginTop: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  carHint: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  carHintDot: {
    color: colors.success,
    fontSize: 7,
  },
  carHintText: {
    color: colors.muted,
    fontSize: 8.5,
    fontWeight: '700',
  },
  carButton: {
    minWidth: 126,
    minHeight: 39,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.gold,
  },
  carButtonText: {
    color: colors.bg,
    fontSize: 10,
    fontWeight: '900',
  },
  carButtonArrow: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '900',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionMore: {
    color: colors.gold,
    fontSize: 9.5,
    fontWeight: '850',
  },
  categoryRail: {
    flexDirection: 'row-reverse',
    gap: 11,
    paddingRight: 1,
  },
  categoryCard: {
    width: 92,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 22,
    backgroundColor: '#0D1827',
    borderWidth: 1,
    borderColor: '#172943',
  },
  categoryIconWrap: {
    position: 'relative',
    overflow: 'hidden',
    width: 53,
    height: 53,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#091421',
  },
  categoryIconGlow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    opacity: 0.08,
  },
  categorySymbol: {
    fontSize: 21,
    fontWeight: '900',
  },
  categoryText: {
    color: colors.text,
    fontSize: 10.5,
    fontWeight: '850',
  },

  offerHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  offerBadge: {
    minWidth: 46,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#35202A',
    borderWidth: 1,
    borderColor: '#66303E',
  },
  offerBadgeText: {
    color: '#FF8B96',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  offerHeaderCopy: {
    flex: 1,
  },
  offerTitle: {
    color: colors.text,
    textAlign: 'right',
    fontSize: 18,
    fontWeight: '900',
  },
  offerSubtitle: {
    marginTop: 2,
    color: colors.muted,
    textAlign: 'right',
    fontSize: 10,
  },
  offerRail: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingRight: 1,
  },
  offerCard: {
    width: 235,
    minHeight: 245,
    padding: 15,
    borderRadius: 24,
    borderWidth: 1,
  },
  offerCardGold: {
    backgroundColor: '#18170F',
    borderColor: '#4A3C10',
  },
  offerCardBlue: {
    backgroundColor: '#0C1828',
    borderColor: '#1E4165',
  },
  offerCardTop: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  offerCardTag: {
    minHeight: 24,
    paddingHorizontal: 8,
    textAlignVertical: 'center',
    borderRadius: 999,
    color: colors.mutedStrong,
    fontSize: 8.5,
    fontWeight: '850',
    backgroundColor: '#101A28',
  },
  offerVisualGold: {
    width: 75,
    height: 82,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C62B',
  },
  offerVisualBlue: {
    width: 75,
    height: 82,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#194B78',
  },
  offerVisualText: {
    color: colors.bg,
    fontSize: 19,
    fontWeight: '900',
  },
  offerCardTitle: {
    marginTop: 15,
    color: colors.text,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '900',
  },
  offerCardText: {
    marginTop: 5,
    color: colors.muted,
    textAlign: 'right',
    fontSize: 9.5,
    lineHeight: 17,
  },
  offerCardButton: {
    marginTop: 16,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.gold,
  },
  offerCardButtonBlue: {
    marginTop: 16,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1E5B8B',
  },
  offerCardButtonText: {
    color: colors.bg,
    fontSize: 10,
    fontWeight: '900',
  },

  finalCta: {
    minHeight: 125,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 13,
    padding: 17,
    borderRadius: 24,
    backgroundColor: '#111C2D',
    borderWidth: 1,
    borderColor: '#263A55',
  },
  finalCtaCopy: {
    flex: 1,
  },
  finalCtaKicker: {
    color: colors.gold,
    textAlign: 'right',
    fontSize: 8.5,
    fontWeight: '900',
  },
  finalCtaTitle: {
    marginTop: 4,
    color: colors.text,
    textAlign: 'right',
    fontSize: 17,
    fontWeight: '900',
  },
  finalCtaText: {
    marginTop: 5,
    color: colors.muted,
    textAlign: 'right',
    fontSize: 9.5,
    lineHeight: 17,
  },
  finalCtaButton: {
    minWidth: 93,
    minHeight: 42,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 13,
    backgroundColor: colors.gold,
  },
  finalCtaButtonText: {
    color: colors.bg,
    fontSize: 10,
    fontWeight: '900',
  },
  finalCtaButtonArrow: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '900',
  },
});
