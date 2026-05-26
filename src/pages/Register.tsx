import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { authAPI } from '../api/auth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    if (values.password !== values.confirm_password) {
      message.error('两次输入的密码不一致');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.register({
        email: values.email,
        password: values.password,
        phone: values.phone,
        username: values.username
      });
      
      if (response.code === 200) {
        message.success('注册成功！请登录');
        navigate('/login');
      } else {
        message.error(response.message || '注册失败');
      }
    } catch (error: any) {
      message.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <Card className="w-96 shadow-xl">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-orange-600">🛒 商家后台</div>
          <p className="text-gray-500 mt-2">注册新账号</p>
        </div>
        
        <Form name="register" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱' }]}>
            <Input prefix={<MailOutlined />} placeholder="example@email.com" />
          </Form.Item>

          <Form.Item name="phone" label="手机号">
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>

          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6, message: '密码至少6个字符' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item name="confirm_password" label="确认密码" rules={[{ required: true, message: '请确认密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="bg-orange-500">
              注册
            </Button>
          </Form.Item>

          <div className="text-center">
            已有账号？ <Link to="/login" className="text-orange-600">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
