import { User, ApiResponse } from '../types';
import { getDynamicHeaders } from './sdkHelper';

export const authAPI = {
  // 用户登录
  login: async (email: string, password: string): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 只改这里：使用动态头
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
    
    if (data.rows && data.rows.length > 0) {
      const user = data.rows[0];
      const token = btoa(JSON.stringify({ id: user.id, email: user.email }));
      return { code: 200, message: '登录成功', data: { token, user } };
    }
    return { code: 401, message: '用户名或密码错误' };
  },

  // 用户注册
  register: async (user: User): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 只改这里：使用动态头
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
    const headers = await getDynamicHeaders();  // 只改这里：使用动态头
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