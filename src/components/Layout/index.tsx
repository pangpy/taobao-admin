import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from '../MobileBottomNav';
import { User } from '../../types';
import { cartAPI } from '../../api/cart';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [cartCount, setCartCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchCartCount();
    }
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const res = await cartAPI.getCart(user!.id!);
      if (res.rows) {
        setCartCount(res.rows.length);
      }
    } catch (error) {
      console.error('获取购物车数量失败:', error);
    }
  };

  // 登录/注册页不显示布局组件
  if (location.pathname === '/login' || location.pathname === '/register') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} onLogout={onLogout} cartCount={cartCount} isMobile={isMobile} />
      
      {/* main 内容区 - 移动端允许横向滚动 */}
      <main className={`flex-1 ${isMobile ? 'px-3 py-3' : 'container mx-auto px-4 py-8'}`}>
        <Outlet />
      </main>
      
      {isMobile ? (
        <MobileBottomNav cartCount={cartCount} />
      ) : (
        <Footer />
      )}
    </div>
  );
};

export default Layout;