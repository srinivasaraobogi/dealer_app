import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert,
} from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, LoadingScreen, Divider, InfoRow } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { productsAPI } from '../../services/api';
import { formatCurrency, calculateDiscount, getStockStatus } from '../../utils/helpers';
import { useCart } from '../../store/CartContext';

const QuantitySelector = ({ quantity, onIncrease, onDecrease, moq, stock }) => (
  <View style={styles.quantitySelector}>
    <TouchableOpacity
      style={[styles.qtyBtn, quantity <= moq && styles.qtyBtnDisabled]}
      onPress={onDecrease}
      disabled={quantity <= moq}
    >
      <Text style={styles.qtyBtnText}>−</Text>
    </TouchableOpacity>
    <View style={styles.qtyDisplay}>
      <Text style={styles.qtyValue}>{quantity}</Text>
      <Text style={styles.qtyUnit}>units</Text>
    </View>
    <TouchableOpacity
      style={[styles.qtyBtn, quantity >= stock && styles.qtyBtnDisabled]}
      onPress={onIncrease}
      disabled={quantity >= stock}
    >
      <Text style={styles.qtyBtnText}>+</Text>
    </TouchableOpacity>
  </View>
);

const ProductDetailsScreen = ({ navigation, route }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart, cartContainsProduct } = useCart();

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const res = await productsAPI.getById(productId);
      setProduct(res.data.data);
      setQuantity(res.data.data.moq);
    } catch (error) {
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDecrease = () => {
    if (quantity > product.moq) setQuantity(q => q - 1);
  };

  const handleIncrease = () => {
    if (quantity < product.stock) setQuantity(q => q + 1);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addToCart(product._id, quantity);
      Alert.alert('✅ Added!', `${product.name} added to cart`, [
        { text: 'Continue Shopping' },
        { text: 'View Cart', onPress: () => navigation.navigate('OrderSummary') },
      ]);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add to cart';
      Alert.alert('Error', msg);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading product..." />;
  if (!product) return null;

  const stock = getStockStatus(product.stock, product.stockThreshold);
  const discount = calculateDiscount(product.oldPrice, product.price);
  const taxRate = 0.18;
  const lineTotal = product.price * quantity;
  const total = lineTotal * (1 + taxRate);
  const inCart = cartContainsProduct(product._id);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Product Details" showBack showCart />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: product.images?.[0]?.url || 'https://via.placeholder.com/400' }}
            style={styles.productImage}
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Basic Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.skuText}>{product.sku}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <View>
              <Text style={styles.priceLabel}>Your Price</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatCurrency(product.price)}</Text>
                {product.oldPrice > product.price && (
                  <Text style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</Text>
                )}
              </View>
            </View>
            <View style={[styles.stockIndicator, { backgroundColor: stock.color + '15' }]}>
              <View style={[styles.stockDot, { backgroundColor: stock.color }]} />
              <View>
                <Text style={[styles.stockLabel, { color: stock.color }]}>{stock.label}</Text>
                <Text style={styles.stockQty}>{product.stock} units</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Description */}
        {product.description && (
          <Card>
            <Text style={styles.sectionTitle}>Product Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </Card>
        )}

        {/* Specifications */}
        {product.specifications?.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Specifications</Text>
            {product.specifications.map((spec, idx) => (
              <InfoRow key={idx} label={spec.key} value={`${spec.value}${spec.unit ? ` ${spec.unit}` : ''}`} />
            ))}
          </Card>
        )}

        {/* Delivery */}
        <Card>
          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryIcon}>🚚</Text>
            <View>
              <Text style={styles.sectionTitle}>Delivery SLA</Text>
              <Text style={styles.deliverySla}>{product.deliverySla}</Text>
            </View>
          </View>
        </Card>

        {/* MOQ Info */}
        <Card style={styles.moqCard}>
          <View style={styles.moqRow}>
            <Text style={styles.moqIcon}>📦</Text>
            <View>
              <Text style={styles.moqTitle}>Minimum Order Quantity</Text>
              <Text style={styles.moqValue}>{product.moq} units</Text>
            </View>
          </View>
          {product.stock < product.moq && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠️ Current stock is below MOQ</Text>
            </View>
          )}
        </Card>

        {/* Quantity Selector & Total */}
        {stock.canOrder && (
          <Card>
            <Text style={styles.sectionTitle}>Select Quantity</Text>
            <QuantitySelector
              quantity={quantity}
              onDecrease={handleDecrease}
              onIncrease={handleIncrease}
              moq={product.moq}
              stock={product.stock}
            />
            {quantity > product.stock && (
              <Text style={styles.stockWarning}>⚠️ Insufficient Stock</Text>
            )}

            <Divider />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total (Including Tax)</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
            <Text style={styles.totalBreakdown}>
              {quantity} × {formatCurrency(product.price)} + {(taxRate * 100).toFixed(0)}% tax
            </Text>
          </Card>
        )}

        {/* View Cart Shortcut */}
        {inCart && (
          <TouchableOpacity style={styles.viewCartShortcut} onPress={() => navigation.navigate('OrderSummary')}>
            <Text style={styles.viewCartIcon}>🛒</Text>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Text style={styles.viewCartArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <Button
          title={stock.canOrder ? '+ Add to Cart' : 'Out of Stock'}
          onPress={handleAddToCart}
          disabled={!stock.canOrder || quantity > product.stock}
          loading={addingToCart}
          style={styles.addBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  imageSection: { position: 'relative', backgroundColor: COLORS.surface },
  productImage: { width: '100%', height: 280, resizeMode: 'contain' },
  discountBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: COLORS.danger, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  discountText: { color: '#FFF', fontWeight: 'bold', fontSize: FONTS.sizes.sm },
  infoCard: { margin: SPACING.base, marginBottom: SPACING.sm },
  skuText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 4 },
  productName: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  pricingSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  priceLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm },
  price: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.primary },
  oldPrice: { fontSize: FONTS.sizes.md, color: COLORS.textLight, textDecorationLine: 'line-through' },
  stockIndicator: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: 10, padding: SPACING.sm },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  stockQty: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  description: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 22 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  deliveryIcon: { fontSize: 32 },
  deliverySla: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  moqCard: { marginHorizontal: SPACING.base, marginBottom: SPACING.sm },
  moqRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  moqIcon: { fontSize: 32 },
  moqTitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  moqValue: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text },
  warningBanner: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: SPACING.sm, marginTop: SPACING.sm },
  warningText: { color: '#92400E', fontSize: FONTS.sizes.sm },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.lg, marginVertical: SPACING.md },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { backgroundColor: COLORS.border },
  qtyBtnText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  qtyDisplay: { alignItems: 'center' },
  qtyValue: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.text },
  qtyUnit: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  stockWarning: { color: COLORS.danger, fontSize: FONTS.sizes.sm, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.text },
  totalValue: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.primary },
  totalBreakdown: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textAlign: 'right' },
  viewCartShortcut: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary + '15',
    margin: SPACING.base, borderRadius: 12, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.secondary + '30',
  },
  viewCartIcon: { fontSize: 20, marginRight: SPACING.sm },
  viewCartText: { flex: 1, fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.secondary },
  viewCartArrow: { fontSize: 20, color: COLORS.secondary },
  footer: { padding: SPACING.base, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  addBtn: {},
});

export default ProductDetailsScreen;
