// src/components/common/Navbar.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { ensureProfile } from '../../lib/profile';

const Navbar = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const data = await ensureProfile(session.user);

      if (data) {
        setProfile(data);
      } else {
        setProfile({
          full_name: session.user.user_metadata?.full_name || 'User',
          role: session.user.user_metadata?.role || 'admin',
          email: session.user.email,
        });
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return { text: 'Administrator', color: 'bg-purple-100 text-purple-700' };
      case 'technician': return { text: 'Technician', color: 'bg-blue-100 text-blue-700' };
      case 'viewer': return { text: 'Viewer', color: 'bg-gray-100 text-gray-700' };
      default: return { text: 'User', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const roleBadge = getRoleBadge(profile?.role);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-3 flex items-center justify-between">

        {/* Left Side - Page Title Space */}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">MaintainIQ</h2>
        </div>

        {/* Right Side - User Profile */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-100 
                transition-all"
            >
              {/* Avatar */}
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl 
                flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              {/* User Info */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-700 leading-tight">
                  {profile?.full_name || 'User'}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge?.color}`}>
                  {roleBadge?.text}
                </span>
              </div>

              <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform 
                ${showDropdown ? 'rotate-180' : ''}`}></i>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border 
                border-gray-100 py-2 z-50">

                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-bold text-gray-800 text-sm">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">{profile?.email || 'user@email.com'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${roleBadge?.color}`}>
                    {roleBadge?.text}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 
                    transition-all text-sm text-red-600 font-medium mt-1"
                >
                  <i className="fas fa-sign-out-alt w-5"></i>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
