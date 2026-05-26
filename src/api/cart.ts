import { CartItem, ApiResponse } from '../types';
import { getDynamicHeaders } from './sdkHelper';

export const cartAPI = {
  // 获取购物车
  getCart: async (userId: number): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const response = await fetch('https://api.apiscode.org/api/crud/cart/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "SELECT",
        user_id: userId
      })
    });
    return await response.json();
  },

  // 添加到购物车
  addToCart: async (item: CartItem): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const response = await fetch('https://api.apiscode.org/api/crud/cart/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "INSERT",
        user_id: item.user_id,
        product_id: item.product_id,
        quantity: item.quantity
      })
    });
    return await response.json();
  },

  // 更新购物车数量
  updateCart: async (id: number, quantity: number): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const response = await fetch('https://api.apiscode.org/api/crud/cart/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "UPDATE",
        id: id,
        quantity: quantity
      })
    });
    return await response.json();
  },

  // 删除购物车项
  removeFromCart: async (id: number): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const response = await fetch('https://api.apiscode.org/api/crud/cart/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "DELETE",
        id: id
      })
    });
    return await response.json();
  }
};

export default cartAPI;