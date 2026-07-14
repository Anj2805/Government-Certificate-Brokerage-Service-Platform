import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPathByRole } from '../../config/roleRoutes';
import { PATHS } from '../../config/paths';
import { getProfilePhotoUrl, getCitizenProfilePhotoUrl } from '../../api/httpClient';
import { tokenStorage } from '../../utils/tokenStorage';

export default function AuthenticatedUserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  if (!user) return null;

  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');
  const showDashboard = !(user.role === 'agent' && user.agentStatus === 'pending');

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="relative focus:outline-none focus:ring-2 focus:ring-[#13448a] rounded-full"
      >
        {user.avatar || user.profilePhoto ? (
          <img
            src={user.avatar || (user.role === 'citizen' ? getCitizenProfilePhotoUrl(tokenStorage.getAccessToken()) : getProfilePhotoUrl(tokenStorage.getAccessToken()))}
            alt="User avatar"
            className="h-9 w-9 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-blue-100 text-[#13448a] flex items-center justify-center text-[12px] font-extrabold border border-blue-200 uppercase">
            {initials || 'U'}
          </div>
        )}
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 text-[13px] font-semibold text-gray-700">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-extrabold text-gray-900 truncate">{user.firstName} {user.lastName}</div>
            <div className="text-[11px] text-gray-500 capitalize font-medium">{user.role}</div>
          </div>
          
          <div className="py-1">
            {user.role === 'citizen' && (
              <>
                <Link to={PATHS.CITIZEN_PROFILE} onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors">
                  Profile
                </Link>
                <Link to={PATHS.CITIZEN_SETTINGS} onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors">
                  Settings
                </Link>
              </>
            )}
            {user.role === 'agent' && (
              <Link to={PATHS.AGENT_PROFILE} onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors">
                Profile
              </Link>
            )}
            
            {showDashboard && (
              <Link to={getDashboardPathByRole(user.role)} onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors">
                Dashboard
              </Link>
            )}
          </div>
          
          <div className="py-1 border-t border-gray-100">
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
