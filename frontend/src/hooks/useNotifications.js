import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { role } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    if (!role) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        if (res.success) {
          setUnreadCount((prevCount) => {
            const newCount = res.data.unreadCount;
            if (newCount > prevCount) {
              toast.success('You have a new notification!', { icon: '🔔' });
            }
            return newCount;
          });
        }
      } catch (e) {
        // fail silently
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [role, location.pathname]);

  const loadRecentNotifications = useCallback(async () => {
    if (!role) return;
    setLoadingNotifications(true);
    try {
      const res = await notificationApi.listNotifications({ page: 1, limit: 5 });
      if (res.success) {
        setNotifications(res.data.notifications);
      }
    } catch (e) {
      // fail silently
    } finally {
      setLoadingNotifications(false);
    }
  }, [role]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      // fail silently
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      // fail silently
    }
  }, []);

  return {
    unreadCount,
    notifications,
    loadingNotifications,
    loadRecentNotifications,
    markAllAsRead,
    markAsRead,
  };
}
