import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authAPI } from '../api/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authAPI.login(values.email, values.password);
      if (response.code === 200 && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        message.success('登录成功！');
        navigate('/');
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (error: any) {
      message.error('登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <Card className="w-96 shadow-xl">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-orange-600">🛒网店商家后台</div>
          <p className="text-gray-500 mt-2">登录你的账号</p>
        </div>
        
        <Form name="login" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱' }]}>
            <Input prefix={<UserOutlined />} placeholder="example@email.com" />
          </Form.Item>

          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="bg-orange-500">
              登录
            </Button>
          </Form.Item>

          <div className="text-center">
            还没有账号？ <Link to="/register" className="text-orange-600">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
