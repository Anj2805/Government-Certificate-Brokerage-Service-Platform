import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import Button from '../ui/Button';
import logoVertical from '../../assets/logovertical.png';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPathByRole } from '../../config/roleRoutes';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { label: 'Services', to: PATHS.SERVICES },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Benefits', to: '/#benefits' },
  { label: 'FAQ', to: '/#faq' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isBootstrapping, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(PATHS.HOME);
    setMenuOpen(false);
  };

  const renderAuthActions = () => {
    if (isBootstrapping) {
      return <div className="w-[150px] h-9" />; // Stable skeleton reserved space
    }

    if (isAuthenticated && user) {
      const showDashboard = !(user.role === 'agent' && user.agentStatus === 'pending');
      const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');

      return (
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <button className="relative p-2 rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {showDashboard && (
            <Button as={Link} to={getDashboardPathByRole(user.role)} variant="secondary" size="sm" className="hidden sm:inline-flex">
              Dashboard
            </Button>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-full"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="User avatar"
                  className="h-9 w-9 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-900 flex items-center justify-center text-[12px] font-extrabold border border-brand-200 uppercase">
                  {initials || 'U'}
                </div>
              )}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 text-[13px] font-semibold text-gray-700">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-extrabold text-gray-900 truncate">{user.firstName} {user.lastName}</div>
                  <div className="text-[11px] text-gray-500 capitalize">{user.role}</div>
                </div>
                {showDashboard && (
                  <Link to={getDashboardPathByRole(user.role)} onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 no-underline sm:hidden">
                    Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 font-bold transition-colors">
                  Logout
                </button>
              </div>
            )}
          </div>
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
