import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { User } from '../../types';
import { cartAPI } from '../../api/cart';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [cartCount, setCartCount] = useState(0);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={onLogout} cartCount={cartCount} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
