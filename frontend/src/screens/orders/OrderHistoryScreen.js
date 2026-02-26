import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../../components/common/Header';
import { EmptyState, StatusBadge, Card } from '../../components/common';
import { COLORS, FONTS, SPACING, ORDER_STATUS } from '../../constants';
import { ordersAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

const STATUS_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
const TAB_LABELS = { ALL: 'All', PENDING: 'Pending', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped', DELIVERED: 'Delivered' };

const CANCELLABLE = ['PENDING', 'CONFIRMED'];

const OrderCard = ({ order, onPress, onInvoice, onCancel, onTrack, onReorder, onReturn }) => {
  const status = ORDER_STATUS[order.status] || { label: order.status, color: '#999' };
  const canCancel = CANCELLABLE.includes(order.status);

  return (
    <Card style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{order.orderId}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View>
          <StatusBadge status={order.status} label={status.label} color={status.color} />
          <Text style={styles.itemCount}>{order.items?.length || 0} items</Text>
        </View>
      </View>
      <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onInvoice}>
          <Text style={styles.actionText}>📄 Invoice</Text>
        </TouchableOpacity>
        {canCancel && (
          <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
            <Text style={styles.actionText}>👁 View Details</Text>
          </TouchableOpacity>
        )}
        {canCancel && (
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={[styles.actionText, styles.cancelText]}>✕ Cancel</Text>
          </TouchableOpacity>
        )}
        {order.status === 'SHIPPED' && (
          <TouchableOpacity style={styles.actionBtn} onPress={onTrack}>
            <Text style={styles.actionText}>🚚 Track</Text>
          </TouchableOpacity>
        )}
        {order.status === 'DELIVERED' && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={onReorder}>
              <Text style={styles.actionText}>🔄 Reorder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={onReturn}>
              <Text style={styles.actionText}>↩ Return</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Card>
  );
};

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadOrders = async (tab = activeTab, pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page: pageNum, limit: 20, ...(tab !== 'ALL' && { status: tab }) };
      const res = await ordersAPI.getAll(params);
      setTotal(res.data.data.total);
      setOrders(prev => pageNum === 1 ? res.data.data.orders : [...prev, ...res.data.data.orders]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setPage(1);
    loadOrders(activeTab, 1);
  }, [activeTab]));

  const handleLoadMore = () => {
    if (!loadingMore && orders.length < total) {
      const next = page + 1;
      setPage(next);
      loadOrders(activeTab, next);
    }
  };

  const handleReorder = async (order) => {
    try {
      await ordersAPI.reorder(order._id);
      navigation.navigate('OrderSummary');
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };

  const handleCancel = (order) => {
    Alert.alert(
      'Cancel Order',
      `Cancel order #${order.orderId}?`,
      [
        { text: 'No, Keep It' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => navigation.navigate('CancelOrder', { order }),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Orders" showBack={false} />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => { setActiveTab(tab); setPage(1); setOrders([]); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No Orders Yet"
          subtitle="Start shopping to see your orders here"
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('ProductsList')}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
              onInvoice={() => navigation.navigate('OrderDetails', { orderId: item._id })}
              onCancel={() => handleCancel(item)}
              onTrack={() => navigation.navigate('TrackShipment', { orderId: item._id })}
              onReorder={() => handleReorder(item)}
              onReturn={() => navigation.navigate('ReturnInitiation', { orderId: item._id })}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} style={{ padding: SPACING.base }} /> : null}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Support */}
      <TouchableOpacity style={styles.supportBar} onPress={() => navigation.navigate('ContactSupport')}>
        <Text style={styles.supportText}>Need Support? </Text>
        <Text style={styles.contactLink}>Contact Us →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '500' },
  activeTabText: { color: COLORS.primary, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: SPACING.base },
  orderCard: { marginBottom: SPACING.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  orderId: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text },
  orderDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  itemCount: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 4, textAlign: 'right' },
  orderTotal: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.md },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionBtn: { backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  actionText: { fontSize: FONTS.sizes.xs, color: COLORS.text, fontWeight: '500' },
  cancelBtn: { borderColor: COLORS.danger + '60', backgroundColor: COLORS.danger + '08' },
  cancelText: { color: COLORS.danger },
  supportBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.surface, padding: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  supportText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  contactLink: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
});

export default OrderHistoryScreen;
