import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import Button from '../ui/Button';
import logoVertical from '../../assets/logovertical.png';
import { useAuth } from '../../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBell from '../ui/NotificationBell';
import AuthenticatedUserMenu from '../ui/AuthenticatedUserMenu';

const navItems = [
  { label: 'Services', to: PATHS.SERVICES },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Benefits', to: '/#benefits' },
  { label: 'FAQ', to: '/#faq' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  const {
    unreadCount,
    notifications,
    loadingNotifications,
    loadRecentNotifications,
    markAllAsRead,
    markAsRead,
  } = useNotifications();


  const renderAuthActions = () => {
    if (isBootstrapping) {
      return <div className="w-[150px] h-9" />; // Stable skeleton reserved space
    }

    if (isAuthenticated && user) {
      return (
        <div className="flex items-center gap-4">
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
      );
    }

    const isLogin = pathname === PATHS.LOGIN;
    const isRegister = pathname === PATHS.REGISTER;

    return (
      <div className="flex items-center gap-2">
        {!isLogin && (
          <Button as={Link} to={PATHS.LOGIN} variant={isRegister ? 'primary' : 'secondary'} size="sm">
            Login
          </Button>
        )}
        {!isRegister && (
          <Button as={Link} to={PATHS.REGISTER} variant="primary" size="sm" className="hidden sm:inline-flex">
            Register
          </Button>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-civic-line bg-white">
      <div className="border-b border-civic-line bg-brand-900 text-white">
        <div className="portal-container flex min-h-9 items-center justify-between gap-4 py-2 text-xs font-medium">
          <span>Government Service Assistance Portal</span>
          <span className="hidden sm:inline">Accessible services for citizens, agents, and administrators</span>
        </div>
      </div>
      <nav className="portal-container flex min-h-20 items-center justify-between gap-6 py-4" aria-label="Main navigation">
        <Link to={PATHS.HOME} className="shrink-0 no-underline" aria-label="SevaSetu home">
          <img src={logoVertical} alt="SevaSetu Logo" className="h-[42px] w-auto object-contain" />
        </Link>
        <div className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className="text-sm font-semibold text-ink-700 no-underline hover:text-brand-700"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        {renderAuthActions()}
      </nav>
    </header>
  );
}
