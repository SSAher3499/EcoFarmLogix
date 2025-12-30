import api from './api';

export const notificationService = {
  getNotifications: (page = 1, limit = 20, unreadOnly = false) =>
    api.get(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`),

  getUnreadCount: () => api.get('/notifications/unread-count'),

  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),

  markAllAsRead: () => api.patch('/notifications/read-all'),

  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),

  clearAll: () => api.delete('/notifications')
};

export default notificationService;
