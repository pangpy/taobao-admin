// src/api/cart.ts
import { getDynamicHeaders } from './sdkHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.apiscode.org';

export const cartAPI = {
  // 获取购物车
  getCart: async (userId: number) => {
    const headers = await getDynamicHeaders();
    try {
      const response = await fetch(`${API_BASE_URL}/api/crud/cart/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "SELECT",
          user_id: userId
        })
      });
      const data = await response.json();
      console.log('getCart 原始返回:', data);
      
      // 统一返回格式
      if (data.code === 200 && data.result && data.result.data) {
        return { code: 200, rows: data.result.data };
      }
      return data;
    } catch (error) {
      console.error('getCart 错误:', error);
      return { code: 500, message: '网络错误', rows: [] };
    }
  },

  // 添加到购物车
  addToCart: async (item: {
    user_id: number;
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    product_image?: string;
  }) => {
    const headers = await getDynamicHeaders();
    try {
      const response = await fetch(`${API_BASE_URL}/api/crud/cart/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "INSERT",
          user_id: item.user_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          product_image: item.product_image || '',
          selected: true
        })
      });
      return await response.json();
    } catch (error) {
      console.error('addToCart 错误:', error);
      return { code: 500, message: '网络错误' };
    }
  },

  // 更新数量
  updateCart: async (id: number, quantity: number) => {
    const headers = await getDynamicHeaders();
    try {
      const response = await fetch(`${API_BASE_URL}/api/crud/cart/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "UPDATE",
          id: id,
          quantity: quantity
        })
      });
      return await response.json();
    } catch (error) {
      console.error('updateCart 错误:', error);
      return { code: 500, message: '网络错误' };
    }
  },

  // 删除购物车项
  removeFromCart: async (id: number) => {
    const headers = await getDynamicHeaders();
    try {
      const response = await fetch(`${API_BASE_URL}/api/crud/cart/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "DELETE",
          id: id
        })
      });
      return await response.json();
    } catch (error) {
      console.error('removeFromCart 错误:', error);
      return { code: 500, message: '网络错误' };
    }
  }
};