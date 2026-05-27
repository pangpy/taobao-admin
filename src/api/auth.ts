import { User, ApiResponse } from '../types';
import { getDynamicHeaders } from './sdkHelper';

export const authAPI = {
  // 用户登录（修复版）
  login: async (email: string, password: string): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();
    const response = await fetch('https://api.apiscode.org/api/crud/user/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "SELECT",
        email: email,
        password: password
      })
    });
    const data = await response.json();
    
    console.log('登录返回数据:', data);
    
    // ✅ 修复：根据实际返回格式获取用户
    let user = null;
    
    // 格式1: data.result.data (你的后端返回的格式)
    if (data.result && data.result.data && data.result.data.length > 0) {
      user = data.result.data[0];
    }
    // 格式2: data.rows
    else if (data.rows && data.rows.length > 0) {
      user = data.rows[0];
    }
    // 格式3: data.data
    else if (data.data && data.data.length > 0) {
      user = data.data[0];
    }
    // 格式4: 直接返回用户对象
    else if (data.id && data.email) {
      user = data;
    }
    
    if (user && user.id) {
      const token = btoa(JSON.stringify({ id: user.id, email: user.email }));
      // 保存到 localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { code: 200, message: '登录成功', data: { token, user } };
    }
    
    return { code: 401, message: data.message || '用户名或密码错误' };
  },

  // 用户注册（保持不变）
  register: async (user: User): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();
    const response = await fetch('https://api.apiscode.org/api/crud/user/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "INSERT",
        email: user.email,
        password: user.password,
        phone: user.phone || '',
        username: user.username || user.email.split('@')[0],
        role: 'user'
      })
    });
    return await response.json();
  },

  // 获取用户信息
  getUserInfo: async (userId: number): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();
    const response = await fetch('https://api.apiscode.org/api/crud/user/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "SELECT",
        id: userId
      })
    });
    return await response.json();
  }
};

export default authAPI;