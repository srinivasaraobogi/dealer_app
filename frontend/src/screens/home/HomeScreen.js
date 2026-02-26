import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  FlatList, Image, RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HomeHeader } from '../../components/common/Header';
import { SectionHeader, EmptyState, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { productsAPI, bannersAPI, notificationsAPI } from '../../services/api';
import { formatCurrency, calculateDiscount, getStockStatus, debounce } from '../../utils/helpers';
import { useCart } from '../../store/CartContext';

const { width } = Dimensions.get('window');

// Product card for highly demanded / price drop
const ProductCard = ({ product, onPress }) => {
  const stock = getStockStatus(product.stock, product.stockThreshold);
  const discount = calculateDiscount(product.oldPrice, product.price);

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: product.images?.[0]?.url || 'https://via.placeholder.com/150' }}
          style={styles.productImage}
          defaultSource={{ uri: 'https://via.placeholder.com/150' }}
        />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discount}%</Text>
          </View>
        )}
        <View style={[styles.stockBadge, { backgroundColor: stock.color + '20' }]}>
          <Text style={[styles.stockBadgeText, { color: stock.color }]}>{stock.label}</Text>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productSku}>{product.sku}</Text>
        <Text style={styles.productMoq}>MOQ: {product.moq} units</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
          {product.oldPrice > product.price && (
            <Text style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Banner component
const BannerCard = ({ banner, onPress }) => (
  <TouchableOpacity style={styles.bannerCard} onPress={onPress}>
    <Image
      source={{ uri: banner.imageUrl }}
      style={styles.bannerImage}
      defaultSource={{ uri: 'https://via.placeholder.com/800x300?text=Sale' }}
    />
    <View style={styles.bannerOverlay}>
      <Text style={styles.bannerTitle} numberOfLines={2}>{banner.title}</Text>
      {banner.discountPercentage > 0 && (
        <Text style={styles.bannerDiscount}>Up to {banner.discountPercentage}% OFF</Text>
      )}
      <TouchableOpacity style={styles.orderNowBtn} onPress={onPress}>
        <Text style={styles.orderNowText}>Order Now →</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

// Search bar
const SearchBar = ({ onSearch, onFilter }) => {
  const [query, setQuery] = useState('');
  const debouncedSearch = useCallback(debounce(onSearch, 400), [onSearch]);

  const handleChange = (text) => {
    setQuery(text);
    if (text.length >= 2 || text.length === 0) {
      debouncedSearch(text);
    }
  };

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, SKU, category..."
          placeholderTextColor={COLORS.textLight}
          value={query}
          onChangeText={handleChange}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); onSearch(''); }}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.filterBtn} onPress={onFilter}>
        <Text style={styles.filterIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [highlyDemanded, setHighlyDemanded] = useState([]);
  const [priceDrop, setPriceDrop] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { fetchCart } = useCart();

  const loadData = async () => {
    try {
      const [bannersRes, hdRes, pdRes, rvRes, notifRes] = await Promise.allSettled([
        bannersAPI.getAll(),
        productsAPI.getHighlyDemanded(),
        productsAPI.getPriceDrop(),
        productsAPI.getRecentlyViewed(),
        notificationsAPI.getAll({ page: 1, limit: 1 }),
      ]);

      if (bannersRes.status === 'fulfilled') setBanners(bannersRes.value.data.data);
      if (hdRes.status === 'fulfilled') setHighlyDemanded(hdRes.value.data.data);
      if (pdRes.status === 'fulfilled') setPriceDrop(pdRes.value.data.data);
      if (rvRes.status === 'fulfilled') setRecentlyViewed(rvRes.value.data.data);
      if (notifRes.status === 'fulfilled') setNotificationCount(notifRes.value.data.data.unreadCount);
    } catch (error) {
      console.error('Load home data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
    fetchCart();
  }, []));

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const allProducts = React.useMemo(() => {
    const seen = new Set();
    return [...highlyDemanded, ...priceDrop, ...recentlyViewed].filter(p => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  }, [highlyDemanded, priceDrop, recentlyViewed]);

  const searchResults = React.useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return allProducts.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }, [searchQuery, allProducts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) return <LoadingScreen message="Loading home..." />;

  return (
    <View style={styles.container}>
      <HomeHeader notifications={notificationCount} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
      >
        {/* Search */}
        <View style={styles.searchSection}>
          <SearchBar onSearch={handleSearch} onFilter={() => navigation.navigate('ProductsList', { openFilter: true })} />
        </View>

        {searchQuery.length >= 2 ? (
          /* Search Results */
          <View style={styles.section}>
            <SectionHeader
              title={`Search Results (${searchResults.length})`}
              actionLabel="See All"
              onAction={() => navigation.navigate('ProductsList', { search: searchQuery })}
            />
            {searchResults.length === 0 ? (
              <EmptyState message={`No products found for "${searchQuery}"`} />
            ) : (
              <FlatList
                data={searchResults}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                  <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { productId: item._id })} />
                )}
                contentContainerStyle={styles.horizontalList}
              />
            )}
          </View>
        ) : (
          <>
            {/* Banners */}
            {banners.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="🎯 Promotions" actionLabel="See All" onAction={() => navigation.navigate('ProductsList')} />
                <FlatList
                  data={banners}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <BannerCard banner={item} onPress={() => navigation.navigate('ProductsList', { category: item.targetCategory })} />
                  )}
                  contentContainerStyle={styles.bannerList}
                />
              </View>
            )}

            {/* Highly Demanded */}
            {highlyDemanded.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="🔥 Highly Demanded" actionLabel="View All" onAction={() => navigation.navigate('ProductsList', { sort: 'popular' })} />
                <FlatList
                  data={highlyDemanded}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { productId: item._id })} />
                  )}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            )}

            {/* Price Drop */}
            {priceDrop.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="💰 Price Drop" actionLabel="View All" onAction={() => navigation.navigate('ProductsList', { discount: 'true' })} />
                <FlatList
                  data={priceDrop}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { productId: item._id })} />
                  )}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            )}

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="🕐 Recently Viewed" />
                <FlatList
                  data={recentlyViewed.slice(0, 6)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { productId: item._id })} />
                  )}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            )}
          </>
        )}

        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportSubtitle}>Our support team is available 24/7</Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <Text style={styles.contactBtnText}>📞 Contact Us</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  searchSection: { backgroundColor: COLORS.surface, padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchContainer: { flexDirection: 'row', gap: SPACING.sm },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.text, paddingVertical: 12 },
  clearSearch: { fontSize: 16, color: COLORS.textSecondary, padding: SPACING.xs },
  filterBtn: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  filterIcon: { fontSize: 20 },

  section: { padding: SPACING.base, paddingBottom: 0 },
  horizontalList: { paddingRight: SPACING.base },
  bannerList: { paddingRight: SPACING.base },

  // Banner
  bannerCard: {
    width: width - SPACING.xxl * 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: SPACING.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  bannerImage: { width: '100%', height: 150, resizeMode: 'cover' },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: SPACING.md,
  },
  bannerTitle: { color: '#FFF', fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  bannerDiscount: { color: '#FFD700', fontSize: FONTS.sizes.sm, fontWeight: '600' },
  orderNowBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    marginTop: SPACING.xs,
  },
  orderNowText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: '600' },

  // Product Card
  productCard: {
    width: 160,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginRight: SPACING.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  productImageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 130, resizeMode: 'cover' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountBadgeText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  stockBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stockBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  productInfo: { padding: SPACING.sm },
  productName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  productSku: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginBottom: 2 },
  productMoq: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  productPrice: { fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.primary },
  oldPrice: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textDecorationLine: 'line-through' },

  // Support
  supportSection: {
    backgroundColor: COLORS.primary + '10',
    margin: SPACING.base,
    borderRadius: 12,
    padding: SPACING.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  supportTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text },
  supportSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.md },
  contactBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  contactBtnText: { color: '#FFF', fontWeight: '600', fontSize: FONTS.sizes.base },
});

export default HomeScreen;
