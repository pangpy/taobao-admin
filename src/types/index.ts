// 用户类型
export interface User {
  id?: number;
  username?: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  role?: 'admin' | 'user';
  created_at?: string;
}

// 商品类型
export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  category: string;
  stock: number;
  images?: string;
  sales?: number;
  status?: 'on' | 'off';
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

// 订单类型
export interface Order {
  id?: number;
  order_no: string;
  product_id: number;
  product_name?: string;
  user_id: number;
  quantity: number;
  total_price: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  address?: string;
  phone?: string;
  created_at?: string;
}

// 购物车类型
export interface CartItem {
  id?: number;
  user_id: number;
  product_id: number;
  product_name?: string;
  product_price?: number;
  quantity: number;
  created_at?: string;
}

// API响应类型
export interface ApiResponse {
  code: number;
  message: string;
  data?: any;
  rows?: any[];
  total?: number;
}
