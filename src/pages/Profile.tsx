// pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message, Avatar, Descriptions, Spin, Tabs, Space } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
// import { authAPI } from '../api/auth';  // 暂未使用，先注释

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    loadUserInfo();
  }, []);

  const loadUserInfo = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        form.setFieldsValue({
          username: userData.username,
          email: userData.email,
          phone: userData.phone,
        });
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
    setLoading(false);
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const updatedUser = { ...user, ...values };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditMode(false);
      message.success('个人信息更新成功');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    message.success('已退出登录');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  const items = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <div className="p-4">
          {!editMode ? (
            <div>
              <Descriptions column={1} bordered className="mb-6">
                <Descriptions.Item label="用户名">
                  {user?.username || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  {user?.email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="手机号">
                  {user?.phone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="角色">
                  {user?.role === 'admin' ? '管理员' : user?.role === 'user' ? '普通用户' : user?.role || '用户'}
                </Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {user?.create_time ? new Date(user.create_time).toLocaleString() : '-'}
                </Descriptions.Item>
              </Descriptions>
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={() => setEditMode(true)}
              >
                编辑资料
              </Button>
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{
                username: user?.username,
                email: user?.email,
                phone: user?.phone,
              }}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="用户名" />
              </Form.Item>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="example@email.com" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                ]}
              >
                <Input placeholder="手机号" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                    保存
                  </Button>
                  <Button onClick={() => {
                    setEditMode(false);
                    form.setFieldsValue({
                      username: user?.username,
                      email: user?.email,
                      phone: user?.phone,
                    });
                  }}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </div>
      ),
    },
    {
      key: 'security',
      label: '安全设置',
      children: (
        <div className="p-4">
          <Form layout="vertical">
            <Form.Item
              label="修改密码"
              help="密码长度至少6位"
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item label="确认密码">
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary">更新密码</Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'account',
      label: '账号管理',
      children: (
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">账号状态</h3>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="账号状态">
                <span className="text-green-600">正常</span>
              </Descriptions.Item>
              <Descriptions.Item label="登录方式">
                邮箱登录
              </Descriptions.Item>
              <Descriptions.Item label="最后登录时间">
                {new Date().toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3 text-red-600">危险操作</h3>
            <Button danger onClick={handleLogout}>
              退出登录
            </Button>
            <Button danger className="ml-3" disabled>
              注销账号
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">个人中心</h1>
        <p className="text-gray-500 mt-1">管理您的个人信息和账号设置</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 text-center">
          <Avatar 
            size={80} 
            icon={<UserOutlined />} 
            className="mb-4 bg-purple-500"
            src={user?.avatar}
          />
          <h2 className="text-xl font-semibold">{user?.username || user?.email?.split('@')[0]}</h2>
          <p className="text-gray-500">{user?.email}</p>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-around">
              <div>
                <div className="text-gray-500 text-sm">角色</div>
                <div className="font-medium">{user?.role === 'admin' ? '管理员' : '普通用户'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">状态</div>
                <div className="font-medium text-green-600">正常</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <Tabs items={items} defaultActiveKey="info" />
        </Card>
      </div>
    </div>
  );
};

export default Profile;