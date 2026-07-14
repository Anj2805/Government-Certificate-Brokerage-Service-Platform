import { Link, Outlet, useLocation } from 'react-router-dom';
import { PATHS } from '../config/paths';
import { ROLES } from '../config/roles';
import { useAuth } from '../hooks/useAuth';
import logoVertical from '../assets/logovertical.png';
import favicon from '../assets/favicon.png';
const navByRole = {
  [ROLES.CITIZEN]: [
    { label: 'Dashboard', to: PATHS.CITIZEN_DASHBOARD },
    { label: 'My Requests', to: PATHS.CITIZEN_REQUESTS },
    { label: 'New Request', to: PATHS.CITIZEN_CREATE_REQUEST },
    { label: 'Profile', to: PATHS.CITIZEN_PROFILE },
    { label: 'Support', disabled: true },
  ],
  [ROLES.AGENT]: [
    { label: 'Dashboard', to: PATHS.AGENT_DASHBOARD },
    { label: 'Assigned Requests', to: PATHS.AGENT_ASSIGNED_REQUESTS },
    { label: 'Profile', to: PATHS.AGENT_PROFILE },
  ],
  [ROLES.ADMIN]: [
    { label: 'Dashboard', to: PATHS.ADMIN_DASHBOARD },
    { label: 'Citizens', to: PATHS.ADMIN_USERS },
    { label: 'Services', to: PATHS.ADMIN_SERVICES },
    { label: 'Agents', to: PATHS.ADMIN_AGENTS },
    { label: 'Requests', to: PATHS.ADMIN_REQUESTS },
    { label: 'Dead Letters', to: PATHS.ADMIN_DEAD_LETTERS },
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
    case 'Citizens':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'Agents':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'Dead Letters':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'Profile':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from '../components/ui/NotificationBell';
import AuthenticatedUserMenu from '../components/ui/AuthenticatedUserMenu';
import { authApi } from '../api/authApi';
import { toast } from 'react-hot-toast';
import { adminApi } from '../api/adminApi';

export default function DashboardLayout() {
  const { logout, role, user } = useAuth();
  const location = useLocation();
  const navItems = navByRole[role] || [];
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    unreadCount,
    notifications,
    loadingNotifications,
    loadRecentNotifications,
    markAllAsRead,
    markAsRead,
  } = useNotifications();

  // Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!globalSearch || role !== ROLES.ADMIN) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await adminApi.globalSearch(globalSearch);
        setSearchResults(res.data);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'An error occurred');
        console.error("Global search error", err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [globalSearch, role]);

  // Handle route changes to auto-close mobile sidebar
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleResendVerification = async () => {
    try {
      await authApi.resendVerification({ email: user.email });
      toast.success('Verification link sent successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend verification link');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 hidden border-r border-slate-200 bg-white p-4 md:flex flex-col justify-between z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-8 mt-2 px-2">
            <Link to={PATHS.HOME} className="flex items-center no-underline">
              {isCollapsed ? (
                <img src={favicon} alt="Logo" className="h-9 w-9 object-contain mx-auto" />
              ) : (
                <img src={logoVertical} alt="SevaSetu Logo" className="h-9 w-auto object-contain" />
              )}
            </Link>
            {!isCollapsed && (
              <button onClick={() => setIsCollapsed(true)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
              </button>
            )}
          </div>
          <nav className="space-y-1">
            {isCollapsed && (
              <div className="mb-4 flex justify-center">
                <button onClick={() => setIsCollapsed(false)} className="p-2 rounded hover:bg-slate-100 text-slate-500">
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
                </button>
              </div>
            )}
            {navItems.map((item) => {
              const active = item.to && location.pathname === item.to;
              return item.disabled ? (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  title="Support module is planned for a later phase"
                  className={`flex w-full cursor-not-allowed items-center gap-3 rounded-lg py-2.5 text-left text-sm font-semibold text-gray-400 no-underline ${isCollapsed ? 'justify-center px-0' : 'px-3.5'}`}
                >
                  {getIconForLabel(item.label)}
                  {!isCollapsed && <span className="flex-1">{item.label}</span>}
                  {!isCollapsed && <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">Soon</span>}
                </button>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-semibold no-underline transition-colors ${
                    active 
                      ? 'bg-blue-700 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                  } ${isCollapsed ? 'justify-center px-0' : 'px-3.5'}`}
                >
                  {getIconForLabel(item.label)}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-1">
          <Link
            to={PATHS.HOME}
            title={isCollapsed ? "Public Portal" : undefined}
            className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-slate-50 hover:text-gray-900 no-underline transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3.5'}`}
          >
            <svg style={{ width: '18px', height: '18px' }} className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {!isCollapsed && <span>Public Portal</span>}
          </Link>
          {role === ROLES.CITIZEN ? (
            <Link
              to={PATHS.CITIZEN_SETTINGS}
              title={isCollapsed ? "Settings" : undefined}
              className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-slate-50 hover:text-gray-900 no-underline transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3.5'}`}
            >
              <svg style={{ width: '18px', height: '18px' }} className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              {!isCollapsed && <span>Settings</span>}
            </Link>
          ) : (
            <Link
              to={role === ROLES.ADMIN ? PATHS.ADMIN_CHANGE_PASSWORD : PATHS.AGENT_CHANGE_PASSWORD}
              title={isCollapsed ? "Change Password" : undefined}
              className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-slate-50 hover:text-gray-900 no-underline transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3.5'}`}
            >
              <svg style={{ width: '18px', height: '18px' }} className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {!isCollapsed && <span>Change Password</span>}
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            title={isCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-3 rounded-lg py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 no-underline transition-colors ${isCollapsed ? 'justify-center px-0' : 'text-left px-3.5'}`}
          >
            <svg style={{ width: '18px', height: '18px' }} className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-gray-100 h-16 px-4 md:px-6 flex items-center justify-between z-20">
          
          {/* Top Navigation / Actions */}
          <div className="flex items-center gap-4 ml-auto">
            {role === ROLES.CITIZEN ? (
              <Link
                to={PATHS.CITIZEN_CREATE_REQUEST}
                className="hidden sm:flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 px-5 text-sm font-semibold text-white no-underline shadow-sm transition-colors"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                New Request
              </Link>
            ) : null}

            {/* Search (Desktop only) */}
            {role === ROLES.ADMIN && (
              <div className="hidden lg:flex items-center relative" ref={searchRef}>
                <svg className="h-4 w-4 absolute left-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Global Search..."
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] w-64 focus:outline-none focus:ring-2 focus:ring-[#13448a] focus:border-transparent bg-gray-50/50"
                />
                
                {searchOpen && searchResults && (
                  <div className="absolute top-12 right-0 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 max-h-[70vh] overflow-y-auto">
                    {/* Users */}
                    {searchResults.users?.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Citizens</h4>
                        {searchResults.users.map(u => (
                          <Link key={u._id} to={PATHS.ADMIN_USER_DETAILS.replace(':id', u._id)} onClick={() => setSearchOpen(false)} className="block px-2 py-1.5 hover:bg-gray-50 rounded text-[13px] font-semibold text-gray-700">
                            {u.firstName} {u.lastName}
                          </Link>
                        ))}
                      </div>
                    )}
                    {/* Agents */}
                    {searchResults.agents?.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Agents</h4>
                        {searchResults.agents.map(a => (
                          <Link key={a._id} to={PATHS.ADMIN_AGENT_DETAILS.replace(':id', a._id)} onClick={() => setSearchOpen(false)} className="block px-2 py-1.5 hover:bg-gray-50 rounded text-[13px] font-semibold text-gray-700">
                            {a.firstName} {a.lastName} <span className="text-[11px] text-gray-400 font-mono ml-1">({a.agentStatus})</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {/* Requests */}
                    {searchResults.requests?.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Requests</h4>
                        {searchResults.requests.map(r => (
                          <Link key={r._id} to={PATHS.ADMIN_REQUEST_DETAILS.replace(':id', r._id)} onClick={() => setSearchOpen(false)} className="block px-2 py-1.5 hover:bg-gray-50 rounded text-[13px] font-semibold text-gray-700">
                            {r.requestNumber} <span className="text-[11px] text-gray-400 font-mono ml-1">({r.status})</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {/* Services */}
                    {searchResults.services?.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Services</h4>
                        {searchResults.services.map(s => (
                          <Link key={s._id} to={PATHS.SERVICE_DETAILS.replace(':id', s._id)} onClick={() => setSearchOpen(false)} className="block px-2 py-1.5 hover:bg-gray-50 rounded text-[13px] font-semibold text-gray-700">
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {!searchResults.users?.length && !searchResults.agents?.length && !searchResults.requests?.length && !searchResults.services?.length && (
                      <p className="px-2 py-3 text-center text-[12px] text-gray-500 font-semibold">No results found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
                <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                <NotificationBell
                  unreadCount={unreadCount}
                  notifications={notifications}
                  loadingNotifications={loadingNotifications}
                  onOpen={loadRecentNotifications}
                  onMarkAllRead={markAllAsRead}
                  onNotificationClick={markAsRead}
                />

                <AuthenticatedUserMenu />
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
                <button
                  onClick={handleResendVerification}
                  className="text-sm font-bold text-yellow-800 hover:text-yellow-900 underline bg-transparent border-none cursor-pointer"
                >
                  Resend Link
                </button>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
