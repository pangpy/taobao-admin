import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Avatar, Dropdown, Space, MenuProps, Badge } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  ShoppingOutlined, 
  ShoppingCartOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  MenuOutlined,
  MessageOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { User } from '../../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  cartCount?: number;
  isMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, cartCount = 0, isMobile = false }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  // ========== 移动端 Header ==========
  if (isMobile) {
    return (
      <>
        <header className="bg-gradient-to-r from-orange-500 to-red-500 shadow-md sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <div className="text-2xl">🛒</div>
                <div className="text-lg font-bold text-white">
                  网店商家
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge count={cartCount} offset={[5, -5]}>
                  <Button 
                    type="text" 
                    icon={<ShoppingCartOutlined style={{ fontSize: '20px', color: 'white' }} />}
                    onClick={() => navigate('/cart')}
                    className="text-white"
                  />
                </Badge>
                
                <Button 
                  type="text" 
                  icon={<MenuOutlined style={{ fontSize: '20px', color: 'white' }} />}
                  onClick={() => setMobileMenuOpen(true)}
                  className="text-white"
                />
              </div>
            </div>
          </div>
        </header>

        {/* 移动端侧滑菜单 */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed right-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 p-4 animate-slide-in">
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <span className="font-semibold text-lg">菜单</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-2xl text-gray-500">
                  ✕
                </button>
              </div>
              
              {user ? (
                <>
                  <div className="mb-6 pb-4 border-b">
                    <div className="flex items-center space-x-3 mb-2">
                      <Avatar src={user.avatar} icon={<UserOutlined />} />
                      <div>
                        <div className="font-medium">{user.username || user.email}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <nav className="space-y-2">
                    <button 
                      onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full py-3 px-3 rounded-lg hover:bg-gray-100"
                    >
                      <DashboardOutlined />
                      <span>首页</span>
                    </button>
                    <button 
                      onClick={() => { navigate('/products'); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full py-3 px-3 rounded-lg hover:bg-gray-100"
                    >
                      <AppstoreOutlined />
                      <span>商品管理</span>
                    </button>
                    <button 
                      onClick={() => { navigate('/cart'); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full py-3 px-3 rounded-lg hover:bg-gray-100"
                    >
                      <ShoppingCartOutlined />
                      <span>购物车</span>
                    </button>
                    <button 
                      onClick={() => { navigate('/ws-test'); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full py-3 px-3 rounded-lg hover:bg-gray-100"
                    >
                      <MessageOutlined />
                      <span>💬 聊天</span>
                    </button>
                    <button 
                      onClick={() => { navigate('/devices'); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full py-3 px-3 rounded-lg hover:bg-gray-100"
                    >
                      <ApiOutlined />
                      <span>📡 设备管理</span>
                    </button>
                    <button 
                      onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full py-3 px-3 rounded-lg hover:bg-gray-100"
                    >
                      <ShoppingOutlined />
                      <span>我的订单</span>
                    </button>
                    <button 
                      onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full py-3 px-3 rounded-lg hover:bg-gray-100"
                    >
                      <UserOutlined />
                      <span>个人中心</span>
                    </button>
                    <button 
                      onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full py-3 px-3 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <LogoutOutlined />
                      <span>退出登录</span>
                    </button>
                  </nav>
                </>
              ) : (
                <div className="space-y-3">
                  <Button block onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                    登录
                  </Button>
                  <Button block type="primary" onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>
                    注册
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </>
    );
  }

  // ========== PC 端 Header ==========
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

            <Button 
              type="text" 
              icon={<MessageOutlined />}
              onClick={() => navigate('/ws-test')}
              className="text-white hover:bg-orange-600"
            >
              💬 聊天
            </Button>
                        <Button 
              type="text" 
              icon={<ApiOutlined />}
              onClick={() => navigate('/devices')}
              className="text-white hover:bg-orange-600"
            >
              📡 设备管理
            </Button>
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
