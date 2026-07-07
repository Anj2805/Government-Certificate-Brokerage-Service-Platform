import { Link, Outlet, useLocation } from 'react-router-dom';
import { PATHS } from '../config/paths';
import { ROLES } from '../config/roles';
import { useAuth } from '../hooks/useAuth';
import logoVertical from '../assets/logovertical.png';

const navByRole = {
  [ROLES.CITIZEN]: [
    { label: 'Dashboard', to: PATHS.CITIZEN_DASHBOARD },
    { label: 'My Requests', to: PATHS.CITIZEN_REQUESTS },
    { label: 'New Request', to: PATHS.CITIZEN_CREATE_REQUEST },
    { label: 'Support', disabled: true },
  ],
  [ROLES.AGENT]: [
    { label: 'Dashboard', to: PATHS.AGENT_DASHBOARD },
    { label: 'Assigned Requests', to: PATHS.AGENT_ASSIGNED_REQUESTS },
  ],
  [ROLES.ADMIN]: [
    { label: 'Dashboard', to: PATHS.ADMIN_DASHBOARD },
    { label: 'Services', to: PATHS.ADMIN_SERVICES },
    { label: 'Agents', to: PATHS.ADMIN_AGENTS },
    { label: 'Requests', to: PATHS.ADMIN_REQUESTS },
  ],
};

function getIconForLabel(label) {
  const props = { style: { width: '18px', height: '18px' }, className: 'shrink-0' };
  switch (label) {
    case 'Dashboard':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case 'My Requests':
    case 'Assigned Requests':
    case 'Requests':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case 'Create Request':
    case 'New Request':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'Support':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'Services':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case 'Agents':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    default:
      return null;
  }
}

import { useState, useRef, useEffect } from 'react';
import { notificationApi } from '../api/notificationApi';

export default function DashboardLayout() {
  const { logout, role, user } = useAuth();
  const location = useLocation();
  const navItems = navByRole[role] || [];
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (role !== ROLES.CITIZEN) return;

    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        if (res.success) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (e) {
        // fail silently
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [role, location.pathname]);

  useEffect(() => {
    if (notificationMenuOpen && role === ROLES.CITIZEN) {
      setLoadingNotifications(true);
      notificationApi.listNotifications({ page: 1, limit: 5 })
        .then((res) => {
          if (res.success) setNotifications(res.data.notifications);
        })
        .catch(() => {})
        .finally(() => setLoadingNotifications(false));
    }
  }, [notificationMenuOpen, role]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      // fail silently
    }
  };

  const handleNotificationClick = async (notif) => {
    setNotificationMenuOpen(false);
    if (!notif.isRead) {
      try {
        await notificationApi.markAsRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {
        // fail silently
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-6 md:flex flex-col justify-between z-30">
        <div className="space-y-8">
          <Link to={PATHS.HOME} className="flex items-center no-underline px-2 -ml-2 mb-2">
            <img src={logoVertical} alt="SevaSetu Logo" className="h-10 w-auto object-contain" />
          </Link>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = item.to && location.pathname === item.to;
              return item.disabled ? (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  title="Support module is planned for a later phase"
                  className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-[14px] font-bold text-gray-350 no-underline"
                >
                  {getIconForLabel(item.label)}
                  <span className="flex-1">{item.label}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-gray-400">Soon</span>
                </button>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] font-bold no-underline transition-colors ${
                    active 
                      ? 'bg-[#13448a] text-white shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {getIconForLabel(item.label)}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Menu Items */}
        <div className="border-t border-gray-100 pt-4 space-y-1">
          <Link
            to={PATHS.HOME}
            className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] font-bold text-gray-500 hover:bg-gray-50 hover:text-[#13448a] no-underline transition-colors"
          >
            <svg style={{ width: '18px', height: '18px' }} className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Public Portal
          </Link>
          {role === ROLES.CITIZEN ? (
            <Link
              to={PATHS.CITIZEN_SETTINGS}
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] font-bold text-gray-500 hover:bg-gray-50 hover:text-[#13448a] no-underline transition-colors"
            >
              <svg style={{ width: '18px', height: '18px' }} className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </Link>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] font-bold text-red-500 hover:bg-red-50 hover:text-red-600 no-underline transition-colors text-left"
          >
            <svg style={{ width: '18px', height: '18px' }} className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-gray-100 h-16 px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search requests..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-[#13448a] text-[13.5px] font-semibold text-gray-700 placeholder-gray-400 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {role === ROLES.CITIZEN ? (
              <Link
                to={PATHS.CITIZEN_CREATE_REQUEST}
                className="hidden sm:flex h-10 items-center justify-center gap-2 rounded-lg bg-[#13448a] hover:bg-[#0c316a] px-4 text-[13.5px] font-bold text-white no-underline shadow-sm transition-colors"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                New Request
              </Link>
            ) : null}

            {/* Notification bell */}
            {role === ROLES.CITIZEN ? (
              <div className="relative" ref={notificationMenuRef}>
                <button
                  type="button"
                  onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                  className="relative p-2 rounded-full text-gray-500 hover:bg-gray-50 hover:text-[#13448a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#13448a]"
                  aria-haspopup="true"
                  aria-expanded={notificationMenuOpen}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 text-[10px] flex items-center justify-center font-bold text-white rounded-full bg-red-500 ring-2 ring-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {notificationMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                      <span className="text-sm font-extrabold text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs font-bold text-[#13448a] hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="py-8 flex justify-center">
                          <div className="animate-spin h-6 w-6 border-2 border-[#13448a] border-t-transparent rounded-full"></div>
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {notifications.map((notif) => (
                            <Link
                              key={notif.id}
                              to={notif.requestId ? PATHS.CITIZEN_REQUEST_DETAILS.replace(':id', notif.requestId) : '#'}
                              onClick={() => handleNotificationClick(notif)}
                              className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-sm font-bold ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{notif.title}</span>
                                {!notif.isRead && <span className="shrink-0 h-2 w-2 mt-1.5 bg-[#13448a] rounded-full"></span>}
                              </div>
                              <p className={`text-xs mt-1 ${!notif.isRead ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{notif.message}</p>
                              <p className="text-[10px] font-semibold text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-sm font-medium text-gray-500">
                          No notifications
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-50 text-center">
                      <Link to={PATHS.CITIZEN_NOTIFICATIONS} onClick={() => setNotificationMenuOpen(false)} className="text-xs font-bold text-[#13448a] hover:underline">
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Profile Avatar */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#13448a] rounded-full"
              >
                <div className="h-9 w-9 rounded-full bg-[#eff6ff] text-[#13448a] flex items-center justify-center text-[12px] font-extrabold border border-blue-100 uppercase">
                  {initials || 'U'}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
              </button>
              
              {profileMenuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 text-[13px] font-semibold text-gray-700">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-extrabold text-gray-900 truncate">{user?.firstName} {user?.lastName}</div>
                    <div className="text-[11px] text-gray-500 capitalize">Role: {user?.role}</div>
                  </div>
                  {role === ROLES.CITIZEN ? (
                    <Link role="menuitem" to={PATHS.CITIZEN_PROFILE} onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 no-underline">
                      Profile
                    </Link>
                  ) : null}
                  <Link role="menuitem" to={navItems[0]?.to || PATHS.HOME} onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 no-underline">
                    Dashboard
                  </Link>
                  {role === ROLES.CITIZEN ? (
                    <Link role="menuitem" to={PATHS.CITIZEN_SETTINGS} onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 no-underline">
                      Settings
                    </Link>
                  ) : null}
                  <Link role="menuitem" to={PATHS.HOME} onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 no-underline">
                    Public Portal
                  </Link>
                  <div className="border-t border-gray-100 mt-1"></div>
                  <button role="menuitem" onClick={() => { logout(); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 font-bold transition-colors">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 bg-[#f8fafc]">
          {user && !user.emailVerified && user.role !== ROLES.ADMIN && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-yellow-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-yellow-800 font-medium">
                    Please verify your email address. Some features are restricted until verification is complete.
                  </p>
                </div>
                <Link
                  to={PATHS.RESEND_VERIFICATION}
                  className="text-sm font-bold text-yellow-800 hover:text-yellow-900 underline"
                >
                  Resend Link
                </Link>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
