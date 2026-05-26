import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Avatar, Dropdown, Space, MenuProps, Badge } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  ShoppingOutlined, 
  ShoppingCartOutlined,
  DashboardOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { User } from '../../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  cartCount?: number;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, cartCount = 0 }) => {
  const navigate = useNavigate();

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'orders',
      label: '我的订单',
      icon: <ShoppingOutlined />,
      onClick: () => navigate('/orders'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: onLogout,
    },
  ];

  return (
    <header className="bg-gradient-to-r from-orange-500 to-red-500 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="text-2xl">🛒</div>
            <div className="text-xl font-bold text-white">
              网店商家后台
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              type="text" 
              icon={<DashboardOutlined />}
              onClick={() => navigate('/')}
              className="text-white hover:bg-orange-600"
            >
              首页
            </Button>
            
            <Button 
              type="text" 
              icon={<AppstoreOutlined />}
              onClick={() => navigate('/products')}
              className="text-white hover:bg-orange-600"
            >
              商品管理
            </Button>
            
            <Badge count={cartCount} offset={[10, 0]}>
              <Button 
                type="text" 
                icon={<ShoppingCartOutlined />}
                onClick={() => navigate('/cart')}
                className="text-white hover:bg-orange-600"
              >
                购物车
              </Button>
            </Badge>
            
            {user ? (
              <Dropdown menu={{ items: menuItems }} placement="bottomRight">
                <Space className="cursor-pointer hover:bg-orange-600 px-3 py-1 rounded-lg transition-colors">
                  <Avatar src={user.avatar} icon={<UserOutlined />} />
                  <span className="text-white">{user.username || user.email}</span>
                </Space>
              </Dropdown>
            ) : (
              <Space>
                <Button onClick={() => navigate('/login')}>登录</Button>
                <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
              </Space>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
