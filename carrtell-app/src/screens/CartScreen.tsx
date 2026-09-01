import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import type { CartLine } from '../types/models';
import { money } from '../services/format';
import { useMemo, useState } from 'react';

type Props = {
  lines: CartLine[];
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onContinueShopping: () => void;
};

export default function CartScreen({ lines, onIncrement, onDecrement, onContinueShopping }: Props) {
  const [code, setCode] = useState('');
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0), [lines]);
  const discount = code.trim().toUpperCase() === 'CARRTELL' ? Math.min(100000, subtotal) : 0;
  const shipping = subtotal > 0 ? 80000 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  if (!lines.length) {
    return (
      <View style={styles.emptyScreen}>
        <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>▣</Text></View>
        <Text style={styles.emptyTitle}>سبد خریدت خالیه</Text>
        <Text style={styles.emptyText}>از فروشگاه محصولات مناسب خودروت رو اضافه کن.</Text>
        <Pressable style={styles.emptyButton} onPress={onContinueShopping}><Text style={styles.emptyButtonText}>رفتن به فروشگاه</Text></Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View>
        <Text style={styles.title}>سبد خرید</Text>
        <Text style={styles.subtitle}>سفارش را مرور کن و برای ادامه آماده شو</Text>
      </View>

      <View style={styles.lines}>
        {lines.map((line) => (
          <View key={line.product.id} style={styles.line}>
            <View style={styles.lineImage}><Text style={styles.lineImageText}>OIL</Text></View>
            <View style={styles.lineCopy}>
              <Text style={styles.lineBrand}>{line.product.brand}</Text>
              <Text style={styles.lineTitle}>{line.product.title}</Text>
              <Text style={styles.lineGrade}>{line.product.grade}</Text>
              <Text style={styles.linePrice}>{money(line.product.price * line.quantity)}</Text>
            </View>
            <View style={styles.qty}>
              <Pressable style={styles.qtyButton} onPress={() => onIncrement(line.product.id)}><Text style={styles.qtyButtonText}>+</Text></Pressable>
              <Text style={styles.qtyValue}>{line.quantity}</Text>
              <Pressable style={styles.qtyButton} onPress={() => onDecrement(line.product.id)}><Text style={styles.qtyButtonText}>−</Text></Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.discountCard}>
        <Text style={styles.discountTitle}>کد تخفیف</Text>
        <View style={styles.discountRow}>
          <TextInput value={code} onChangeText={setCode} placeholder="مثلاً CARRTELL" placeholderTextColor={colors.muted} style={styles.discountInput} />
          <View style={styles.applyButton}><Text style={styles.applyButtonText}>اعمال</Text></View>
        </View>
        {discount > 0 ? <Text style={styles.discountSuccess}>✓ تخفیف اعمال شد</Text> : null}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}><Text style={styles.summaryValue}>{money(subtotal)}</Text><Text style={styles.summaryLabel}>جمع کالاها</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryValue}>{money(shipping)}</Text><Text style={styles.summaryLabel}>ارسال</Text></View>
        <View style={styles.summaryRow}><Text style={[styles.summaryValue, { color: colors.success }]}>− {money(discount)}</Text><Text style={styles.summaryLabel}>تخفیف</Text></View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}><Text style={styles.totalValue}>{money(total)}</Text><Text style={styles.totalLabel}>مبلغ نهایی</Text></View>
      </View>

      <Pressable
        style={styles.checkout}
        onPress={() => Alert.alert('ادامه ثبت سفارش', 'در مرحله بعد، آدرس، روش ارسال و پرداخت به همین مسیر متصل می‌شود.')}
      >
        <Text style={styles.checkoutText}>ادامه ثبت سفارش</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 15, paddingBottom: 28, gap: 15 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  subtitle: { marginTop: 3, color: colors.muted, fontSize: 10, textAlign: 'right' },

  lines: { gap: 9 },
  line: { minHeight: 114, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 10, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  lineImage: { width: 74, height: 88, borderRadius: 13, backgroundColor: '#F2F4F6', alignItems: 'center', justifyContent: 'center' },
  lineImageText: { color: '#5C6775', fontSize: 17, fontWeight: '900' },
  lineCopy: { flex: 1 },
  lineBrand: { color: colors.success, fontSize: 8.5, fontWeight: '900', textAlign: 'right' },
  lineTitle: { marginTop: 4, color: colors.text, fontSize: 11.5, fontWeight: '850', lineHeight: 17, textAlign: 'right' },
  lineGrade: { marginTop: 3, color: colors.muted, fontSize: 8.5, textAlign: 'right' },
  linePrice: { marginTop: 7, color: colors.text, fontSize: 10, fontWeight: '900', textAlign: 'right' },
  qty: { alignItems: 'center', gap: 5 },
  qtyButton: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#16253A', alignItems: 'center', justifyContent: 'center' },
  qtyButtonText: { color: colors.text, fontSize: 15, fontWeight: '900' },
  qtyValue: { color: colors.text, fontSize: 10, fontWeight: '900' },

  discountCard: { padding: 13, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  discountTitle: { color: colors.text, fontSize: 12, fontWeight: '900', textAlign: 'right' },
  discountRow: { marginTop: 9, flexDirection: 'row-reverse', gap: 7 },
  discountInput: { flex: 1, minHeight: 41, paddingHorizontal: 11, borderRadius: 11, backgroundColor: '#091421', color: colors.text, borderWidth: 1, borderColor: colors.borderSoft, textAlign: 'right' },
  applyButton: { width: 74, minHeight: 41, borderRadius: 11, backgroundColor: '#1D3C5D', alignItems: 'center', justifyContent: 'center' },
  applyButtonText: { color: colors.cyan, fontSize: 9.5, fontWeight: '900' },
  discountSuccess: { marginTop: 7, color: colors.success, fontSize: 8.5, textAlign: 'right' },

  summary: { padding: 14, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.mutedStrong, fontSize: 10 },
  summaryValue: { color: colors.text, fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.borderSoft },
  totalLabel: { color: colors.text, fontSize: 12, fontWeight: '900' },
  totalValue: { color: colors.goldSoft, fontSize: 13, fontWeight: '900' },

  checkout: { minHeight: 50, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  checkoutText: { color: colors.bg, fontSize: 12.5, fontWeight: '900' },

  emptyScreen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  emptyIconText: { color: colors.gold, fontSize: 27, fontWeight: '900' },
  emptyTitle: { marginTop: 17, color: colors.text, fontSize: 20, fontWeight: '900' },
  emptyText: { marginTop: 7, color: colors.muted, fontSize: 10.5, textAlign: 'center' },
  emptyButton: { marginTop: 18, minWidth: 170, minHeight: 45, borderRadius: 13, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  emptyButtonText: { color: colors.bg, fontSize: 11, fontWeight: '900' },
});
