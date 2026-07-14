import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNotificationsPathByRole } from '../../config/roleRoutes';
import { useAuth } from '../../hooks/useAuth';

export default function NotificationBell({
  unreadCount,
  notifications,
  loadingNotifications,
  onOpen,
  onMarkAllRead,
  onNotificationClick,
}) {
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      onOpen?.();
    }
  }, [isOpen, onOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'rejected': return '❌';
      case 'in_progress': return '⏳';
      case 'documents_required': return '⚠️';
      default: return '📝';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#13448a]"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-extrabold text-[14px] text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[12px] font-bold text-[#0066cc] hover:text-[#004c99] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[320px] overflow-y-auto">
            {loadingNotifications ? (
              <div className="p-8 text-center">
                <div className="h-5 w-5 border-2 border-[#13448a] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-[12px] font-bold text-gray-400">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[13px] font-medium text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <li key={notif.id} className="group relative">
                    <button
                      onClick={() => {
                        onNotificationClick?.(notif);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <span className="text-[16px] shrink-0 mt-0.5">{getStatusIcon(notif.data?.status)}</span>
                      <div className="flex-1 pr-6">
                        <p className={`text-[13px] leading-snug ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                          {notif.message}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400 mt-1.5 uppercase tracking-wide">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#0066cc]" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to={getNotificationsPathByRole(role)}
            onClick={() => setIsOpen(false)}
            className="block text-center py-2.5 bg-gray-50 border-t border-gray-100 text-[12px] font-extrabold text-[#0066cc] hover:bg-gray-100 transition-colors uppercase tracking-wider"
          >
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
}
