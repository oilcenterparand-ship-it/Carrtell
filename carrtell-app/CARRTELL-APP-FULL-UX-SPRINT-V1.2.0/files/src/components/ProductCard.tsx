import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { Product } from '../types/models';
import { money } from '../services/format';

type Props = {
  product: Product;
  quantity?: number;
  onAdd: (product: Product) => void;
};

export default function ProductCard({ product, quantity = 0, onAdd }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.image}>
        <Text style={styles.imageMark}>OIL</Text>
        {product.badge ? <Text style={styles.badge}>{product.badge}</Text> : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.brand}>{product.brand}</Text>
        {product.compatible ? <Text style={styles.compatible}>✓ مناسب خودروی شما</Text> : null}
      </View>

      <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
      <Text style={styles.grade}>{product.grade}</Text>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.price}>{money(product.price)}</Text>
          {product.oldPrice ? <Text style={styles.oldPrice}>{money(product.oldPrice)}</Text> : null}
        </View>

        <Pressable style={styles.addButton} onPress={() => onAdd(product)}>
          <Text style={styles.addButtonText}>{quantity > 0 ? `+ ${quantity}` : '+'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 166,
    minHeight: 270,
    padding: 11,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  image: {
    position: 'relative',
    height: 112,
    borderRadius: 14,
    backgroundColor: '#F1F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageMark: {
    color: '#4D5968',
    fontSize: 22,
    fontWeight: '900',
  },
  badge: {
    position: 'absolute',
    right: 7,
    top: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#2F2440',
    color: '#FF9CC0',
    fontSize: 8,
    fontWeight: '900',
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  brand: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '900',
  },
  compatible: {
    color: colors.cyan,
    fontSize: 7.5,
    fontWeight: '800',
  },
  title: {
    marginTop: 6,
    minHeight: 39,
    color: colors.text,
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '850',
    textAlign: 'right',
  },
  grade: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 9.5,
    textAlign: 'right',
  },
  priceRow: {
    marginTop: 'auto',
    paddingTop: 11,
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  price: {
    color: colors.text,
    fontSize: 10.5,
    fontWeight: '900',
    textAlign: 'right',
  },
  oldPrice: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 8,
    textDecorationLine: 'line-through',
    textAlign: 'right',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.bg,
    fontSize: 17,
    fontWeight: '900',
  },
});
