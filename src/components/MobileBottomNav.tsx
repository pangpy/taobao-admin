import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileBottomNavProps {
  cartCount: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ cartCount }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/products', label: '商品', icon: '📦' },
    { path: '/cart', label: '购物车', icon: '🛒', badge: cartCount },
    { path: '/orders', label: '订单', icon: '📋' },
    { path: '/profile', label: '我的', icon: '👤' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-2 z-50 shadow-lg">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center py-1 px-3 rounded-lg relative"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className={`text-xs mt-1 ${isActive ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1 right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;