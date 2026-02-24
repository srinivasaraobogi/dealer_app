import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Card, EmptyState, LoadingScreen, Button } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { notificationsAPI } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';

const ICON_MAP = {
  ORDER: '📦',
  PAYMENT: '💳',
  SHIPPING: '🚚',
  RETURN: '↩️',
  ISSUE: '⚠️',
  SECURITY: '🔒',
  PROMOTION: '🏷️',
  SYSTEM: '🔔',
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { loadNotifications(1, true); }, []);

  const loadNotifications = async (pageNum = 1, reset = false) => {
    try {
      const res = await notificationsAPI.getAll({ page: pageNum, limit: 20 });
      const { notifications: list, pagination } = res.data.data;
      if (reset) {
        setNotifications(list);
      } else {
        setNotifications(prev => [...prev, ...list]);
      }
      setHasMore(pageNum < pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(1, true);
  }, []);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    loadNotifications(page + 1);
  };

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.unreadItem]}
      onPress={() => {
        if (!item.isRead) markRead(item._id);
        // Navigate based on notification type/link
        if (item.link) {
          // Simple deep link routing
          const parts = item.link.split('/');
          if (parts[1] === 'orders' && parts[2]) navigation.navigate('OrderDetails', { orderId: parts[2] });
          else if (parts[1] === 'returns' && parts[2]) navigation.navigate('ReturnDetails', { returnId: parts[2] });
          else if (parts[1] === 'issues' && parts[2]) navigation.navigate('IssueStatus', { issueId: parts[2] });
          else if (parts[1] === 'payments') navigation.navigate('DealerPayments');
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{ICON_MAP[item.type] || '🔔'}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={1}>{item.title}</Text>
          {!item.isRead && <View style={styles.dot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" showBack />
      {unreadCount > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={[styles.list, notifications.length === 0 && styles.emptyList]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <EmptyState
            icon="🔔"
            title="No Notifications"
            subtitle="You're all caught up! Notifications will appear here."
          />
        }
        ListFooterComponent={loadingMore ? <Text style={styles.loadingMore}>Loading more...</Text> : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  unreadCount: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  markAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  list: { padding: SPACING.base },
  emptyList: { flex: 1, justifyContent: 'center' },
  item: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: SPACING.md, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  unreadItem: { backgroundColor: '#EFF6FF', borderColor: COLORS.primary + '40' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon: { fontSize: 20 },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  title: { fontSize: FONTS.sizes.sm, color: COLORS.text, flex: 1 },
  unreadTitle: { fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: SPACING.xs },
  message: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, lineHeight: 16, marginBottom: 4 },
  time: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  separator: { height: SPACING.sm },
  loadingMore: { textAlign: 'center', padding: SPACING.base, color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
});

export default NotificationsScreen;
