import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiTrash2, FiFilter, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { useTranslation } from '../hooks/useTranslation';
import notificationService from '../services/notification.service';
import toast from 'react-hot-toast';

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    type: 'ALL',
    status: 'ALL' // ALL, UNREAD, READ
  });

  useEffect(() => {
    fetchNotifications();
  }, [pagination.page, filters]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const unreadOnly = filters.status === 'UNREAD';
      const response = await notificationService.getNotifications(pagination.page, pagination.limit, unreadOnly);

      let filteredNotifications = response.data.data.notifications;

      // Apply type filter on frontend (since backend doesn't support it)
      if (filters.type !== 'ALL') {
        filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
      }

      // Apply read status filter
      if (filters.status === 'READ') {
        filteredNotifications = filteredNotifications.filter(n => n.isRead);
      }

      setNotifications(filteredNotifications);
      setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      toast.success(t('notifications.markedRead', 'Marked as read'));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success(t('notifications.allMarkedRead', 'All notifications marked as read'));
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success(t('notifications.deleted', 'Notification deleted'));
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t('notifications.confirmClearAll', 'Are you sure you want to delete all notifications?'))) {
      return;
    }

    try {
      await notificationService.clearAll();
      setNotifications([]);
      setPagination(prev => ({ ...prev, total: 0, pages: 0 }));
      toast.success(t('notifications.allCleared', 'All notifications cleared'));
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
    }

    // Navigate based on notification type
    if (notification.farmId) {
      if (notification.type === 'ALERT') {
        navigate(`/farms/${notification.farmId}/history`);
      } else if (notification.type === 'DEVICE_STATUS') {
        navigate(`/farms/${notification.farmId}`);
      } else if (notification.type === 'AUTOMATION') {
        navigate(`/farms/${notification.farmId}/automation`);
      } else if (notification.type === 'SCHEDULE') {
        navigate(`/farms/${notification.farmId}/schedules`);
      } else {
        navigate(`/farms/${notification.farmId}`);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ALERT': return '🚨';
      case 'DEVICE_STATUS': return '📡';
      case 'AUTOMATION': return '⚡';
      case 'SCHEDULE': return '⏰';
      default: return '🔔';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return t('notifications.justNow', 'Just now');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const typeOptions = [
    { value: 'ALL', label: t('notifications.allTypes', 'All Types') },
    { value: 'ALERT', label: t('notifications.alerts', 'Alerts') },
    { value: 'DEVICE_STATUS', label: t('notifications.deviceStatus', 'Device Status') },
    { value: 'AUTOMATION', label: t('notifications.automation', 'Automation') },
    { value: 'SCHEDULE', label: t('notifications.schedule', 'Schedule') }
  ];

  const statusOptions = [
    { value: 'ALL', label: t('notifications.allStatus', 'All') },
    { value: 'UNREAD', label: t('notifications.unread', 'Unread') },
    { value: 'READ', label: t('notifications.read', 'Read') }
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {t('notifications.title', 'Notifications')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('notifications.description', 'Stay updated with your farm activities')}
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500 dark:text-gray-400" />
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              >
                <FiCheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">{t('notifications.markAllRead', 'Mark all read')}</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('notifications.clearAll', 'Clear all')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <FiBell className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('notifications.empty', 'No notifications')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('notifications.emptyDescription', 'You\'re all caught up!')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-green-50 dark:bg-green-900/20' : ''
                }`}
              >
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          !notification.isRead
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {notification.farm && (
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {notification.farm.name}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title={t('notifications.markRead', 'Mark as read')}
                          >
                            <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title={t('notifications.delete', 'Delete')}
                        >
                          <FiTrash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && notifications.length > 0 && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.previous', 'Previous')}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('common.pageOf', `Page ${pagination.page} of ${pagination.pages}`)}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.next', 'Next')}
          </button>
        </div>
      )}
    </div>
  );
}
