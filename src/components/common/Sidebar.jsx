import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { 
      section: 'Main',
      items: [
        { icon: 'fa-th-large', label: 'Dashboard', path: '/' },
        { icon: 'fa-boxes', label: 'Assets', path: '/assets' },
        { icon: 'fa-exclamation-triangle', label: 'Issues', path: '/issues' },
        { icon: 'fa-history', label: 'History', path: '/history' },
      ]
    },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`bg-gray-900 text-white h-screen sticky top-0 transition-all duration-300
      ${collapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl 
            flex items-center justify-center shadow-lg">
            <i className="fas fa-qrcode text-white text-lg"></i>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-extrabold text-lg leading-tight">MaintainIQ</h1>
              <p className="text-xs text-gray-400 leading-tight">Asset Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-6 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
        {menuItems.map((section, idx) => (
          <div key={idx}>
            {!collapsed && (
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">
                {section.section}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl 
                    transition-all text-sm group relative
                    ${isActive(item.path) 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <i className={`fas ${item.icon} w-5 text-center ${collapsed ? 'text-lg' : ''}`}></i>
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                  
                  {/* Active Indicator */}
                  {isActive(item.path) && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></span>
                  )}

                  {/* Tooltip for Collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs 
                      rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-purple-600 rounded-full flex items-center 
          justify-center text-white text-xs shadow-lg hover:bg-purple-700 transition-all z-50"
      >
        <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
      </button>
    </aside>
  );
};

export default Sidebar;