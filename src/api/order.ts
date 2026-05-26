import { Order, ApiResponse } from '../types';
import { getDynamicHeaders } from './sdkHelper';

export const orderAPI = {
  // 获取订单列表
  getOrders: async (userId?: number): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const body: any = { type: "SELECT" };
    if (userId) body.user_id = userId;
    
    const response = await fetch('https://api.apiscode.org/api/crud/order/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  },

  // 创建订单
  createOrder: async (order: Order): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const response = await fetch('https://api.apiscode.org/api/crud/order/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "INSERT",
        order_no: order.order_no,
        product_id: order.product_id,
        user_id: order.user_id,
        quantity: order.quantity,
        total_price: order.total_price,
        status: 'pending',
        address: order.address || '',
        phone: order.phone || ''
      })
    });
    return await response.json();
  },

  // 更新订单状态
  updateOrderStatus: async (id: number, status: string): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const response = await fetch('https://api.apiscode.org/api/crud/order/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "UPDATE",
        id: id,
        status: status
      })
    });
    return await response.json();
  }
};

export default orderAPI;