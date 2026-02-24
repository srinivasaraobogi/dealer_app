import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Image, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Badge, EmptyState, StatusBadge } from '../../components/common';
import { COLORS, FONTS, SPACING, CATEGORIES } from '../../constants';
import { productsAPI, cartAPI } from '../../services/api';
import { formatCurrency, calculateDiscount, getStockStatus, debounce } from '../../utils/helpers';
import { useCart } from '../../store/CartContext';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'discount', label: 'Discount %' },
];

const ProductCard = ({ product, onPress, onAddToCart }) => {
  const stock = getStockStatus(product.stock, product.stockThreshold);
  const discount = calculateDiscount(product.oldPrice, product.price);

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.images?.[0]?.url || 'https://via.placeholder.com/200' }}
          style={styles.productImage}
        />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        <View style={[styles.stockBadge, { backgroundColor: stock.color + '20' }]}>
          <Text style={[styles.stockText, { color: stock.color }]}>{stock.label}</Text>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.sku}>{product.sku}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.moq}>MOQ: {product.moq}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          {product.oldPrice > product.price && (
            <Text style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, !stock.canOrder && styles.disabledBtn]}
          onPress={() => onAddToCart(product)}
          disabled={!stock.canOrder}
        >
          <Text style={styles.addToCartText}>
            {stock.canOrder ? '+ Add to Cart' : 'Out of Stock'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const FilterModal = ({ visible, filters, onApply, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const update = (key, value) => setLocalFilters(prev => ({ ...prev, [key]: value }));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setLocalFilters({ minPrice: '', maxPrice: '', moq: '', discount: false, stockAvailable: false })}>
              <Text style={styles.resetBtn}>Reset</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceRange}>
              <TextInput style={styles.priceInput} placeholder="Min" value={localFilters.minPrice} onChangeText={v => update('minPrice', v)} keyboardType="numeric" />
              <Text style={styles.priceSep}>–</Text>
              <TextInput style={styles.priceInput} placeholder="Max" value={localFilters.maxPrice} onChangeText={v => update('maxPrice', v)} keyboardType="numeric" />
            </View>
            <Text style={styles.filterLabel}>Min MOQ</Text>
            <TextInput style={styles.filterInput} placeholder="Enter MOQ" value={localFilters.moq} onChangeText={v => update('moq', v)} keyboardType="numeric" />

            <TouchableOpacity style={styles.checkRow} onPress={() => update('discount', !localFilters.discount)}>
              <View style={[styles.checkbox, localFilters.discount && styles.checked]}>
                {localFilters.discount && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>Has Discount</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkRow} onPress={() => update('stockAvailable', !localFilters.stockAvailable)}>
              <View style={[styles.checkbox, localFilters.stockAvailable && styles.checked]}>
                {localFilters.stockAvailable && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>In Stock Only</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.filterActions}>
            <Button title="Cancel" onPress={onClose} variant="outline" style={{ flex: 1 }} />
            <Button title="Apply Filters" onPress={() => { onApply(localFilters); onClose(); }} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProductsListScreen = ({ navigation, route }) => {
  const { search: initialSearch, category: initCategory, sort: initSort, discount: initDiscount, openFilter } = route.params || {};
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch || '');
  const [activeCategory, setActiveCategory] = useState(initCategory || 'ALL');
  const [sort, setSort] = useState(initSort || 'popular');
  const [filters, setFilters] = useState({
    minPrice: '', maxPrice: '', moq: '',
    discount: initDiscount === 'true' ? true : false,
    stockAvailable: false,
  });
  const [showFilter, setShowFilter] = useState(openFilter || false);
  const [showSort, setShowSort] = useState(false);
  const { addToCart, fetchCart } = useCart();

  const debouncedSearch = useCallback(debounce((q) => {
    setPage(1);
    setProducts([]);
    loadProducts(1, q, activeCategory, sort, filters);
  }, 400), [activeCategory, sort, filters]);

  const loadProducts = async (pageNum = 1, q = search, cat = activeCategory, s = sort, f = filters) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = {
        page: pageNum, limit: 20, sort: s,
        ...(cat !== 'ALL' && { category: cat }),
        ...(q && q.length >= 2 && { search: q }),
        ...(f.minPrice && { minPrice: f.minPrice }),
        ...(f.maxPrice && { maxPrice: f.maxPrice }),
        ...(f.moq && { moq: f.moq }),
        ...(f.discount && { discount: 'true' }),
        ...(f.stockAvailable && { stockAvailable: 'true' }),
      };
      const res = await productsAPI.getAll(params);
      const { products: newProducts, total: t } = res.data.data;
      setTotal(t);
      setProducts(prev => pageNum === 1 ? newProducts : [...prev, ...newProducts]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadProducts(1); }, [activeCategory, sort, filters]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id, product.moq);
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && products.length < total) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadProducts(nextPage);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Products" showBack showCart />

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryTab, activeCategory === item && styles.activeCategoryTab]}
              onPress={() => { setActiveCategory(item); setPage(1); setProducts([]); }}
            >
              <Text style={[styles.categoryText, activeCategory === item && styles.activeCategoryText]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Search + Sort Row */}
      <View style={styles.searchSortRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChangeText={(v) => { setSearch(v); debouncedSearch(v); }}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
          <Text style={styles.sortBtnText}>⇅ Sort</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)}>
          <Text style={styles.filterBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortOption, sort === opt.value && styles.activeSortOption]}
              onPress={() => { setSort(opt.value); setShowSort(false); setPage(1); setProducts([]); }}
            >
              <Text style={[styles.sortOptionText, sort === opt.value && styles.activeSortText]}>
                {sort === opt.value ? '● ' : ''}{opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Result Count */}
      <View style={styles.resultCount}>
        <Text style={styles.resultText}>Showing {total} items</Text>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : products.length === 0 ? (
        <EmptyState icon="📦" title="No Products Found" subtitle="Try adjusting your search or filters" />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
              onAddToCart={handleAddToCart}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} style={{ padding: SPACING.base }} /> : null}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
        />
      )}

      <FilterModal visible={showFilter} filters={filters} onApply={(f) => { setFilters(f); setPage(1); setProducts([]); }} onClose={() => setShowFilter(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  categoryContainer: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  categoryList: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.sm },
  categoryTab: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 20, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  activeCategoryTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontSize: FONTS.sizes.sm, color: COLORS.text },
  activeCategoryText: { color: '#FFF', fontWeight: '600' },

  searchSortRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, gap: SPACING.sm, backgroundColor: COLORS.surface },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: FONTS.sizes.sm, color: COLORS.text },
  sortBtn: { backgroundColor: COLORS.primary + '15', borderRadius: 8, paddingHorizontal: SPACING.sm, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.primary + '30' },
  sortBtnText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  filterBtn: { backgroundColor: COLORS.background, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: COLORS.border },
  filterBtnText: { fontSize: 18 },

  sortDropdown: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sortOption: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  activeSortOption: { backgroundColor: COLORS.primary + '10' },
  sortOptionText: { fontSize: FONTS.sizes.base, color: COLORS.text },
  activeSortText: { color: COLORS.primary, fontWeight: '600' },

  resultCount: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, backgroundColor: COLORS.background },
  resultText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { padding: SPACING.sm },
  row: { gap: SPACING.sm },

  productCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden', margin: SPACING.xs, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  imageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 140, resizeMode: 'cover' },
  discountBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.danger, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  stockBadge: { position: 'absolute', bottom: 6, right: 6, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  stockText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  productInfo: { padding: SPACING.sm },
  sku: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginBottom: 2 },
  productName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  moq: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: SPACING.sm },
  price: { fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.primary },
  oldPrice: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textDecorationLine: 'line-through' },
  addToCartBtn: { backgroundColor: COLORS.primary, borderRadius: 8, padding: SPACING.sm, alignItems: 'center' },
  disabledBtn: { backgroundColor: COLORS.border },
  addToCartText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: '600' },

  // Filter Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  filterModal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.base, maxHeight: '80%' },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.base },
  filterTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text },
  resetBtn: { color: COLORS.danger, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  filterLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.md },
  filterInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: SPACING.sm, fontSize: FONTS.sizes.base },
  priceRange: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  priceInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: SPACING.sm, fontSize: FONTS.sizes.base },
  priceSep: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.sm },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: COLORS.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  checkLabel: { fontSize: FONTS.sizes.base, color: COLORS.text },
  filterActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.base },
});

export default ProductsListScreen;
