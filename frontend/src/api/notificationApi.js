import httpClient from './httpClient';

export const notificationApi = {
  listNotifications: (params) => {
    return httpClient.get('/notifications', { params }).then((res) => res.data);
  },

  getUnreadCount: () => {
    return httpClient.get('/notifications/unread-count').then((res) => res.data);
  },

  markAsRead: (id) => {
    return httpClient.patch(`/notifications/${id}/read`).then((res) => res.data);
  },

  markAllAsRead: () => {
    return httpClient.patch('/notifications/read-all').then((res) => res.data);
  },
};
