import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';  // ✅ 添加导入
import { User } from './types';
import { initAuthSDK } from './api/sdkHelper';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 初始化 SDK
    const account = import.meta.env.VITE_API_ACCOUNT;
    const totpSecret = import.meta.env.VITE_TOTP_SECRET;
    const accessToken = import.meta.env.VITE_ACCESS_TOKEN;
    
    if (account && totpSecret && accessToken) {
      initAuthSDK({
        baseURL: 'https://api.apiscode.org',
        account: account,
        totpSecret: totpSecret,
        accessToken: accessToken
      });
    } else {
      console.warn('请配置环境变量: VITE_API_ACCOUNT, VITE_TOTP_SECRET, VITE_ACCESS_TOKEN');
    }
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
            <Route index element={<Home />} />
            <Route path="products" element={user ? <Products /> : <Navigate to="/login" />} />
            <Route path="cart" element={user ? <Cart /> : <Navigate to="/login" />} />
            <Route path="orders" element={user ? <Orders /> : <Navigate to="/login" />} />
            {/* ✅ 添加个人中心路由 */}
            <Route path="profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;