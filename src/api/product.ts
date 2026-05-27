import { Product, ApiResponse } from '../types';
import { getDynamicHeaders } from './sdkHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.apiscode.org';

export const productAPI = {
  // 获取商品列表
  getProducts: async (params?: any): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();
    const body: any = { type: "SELECT" };
    
    if (params?.category) body.category = params.category;
    if (params?.status) body.status = params.status;
    if (params?.search) body.name = params.search;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/crud/product/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      console.log('getProducts 响应:', data);
      return data;
    } catch (error) {
      console.error('getProducts 错误:', error);
      return { code: 500, message: '网络错误' };
    }
  },

  // 获取单个商品
  getProductById: async (id: number): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();
    try {
      const response = await fetch(`${API_BASE_URL}/api/crud/product/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "SELECT",
          id: id
        })
      });
      return await response.json();
    } catch (error) {
      console.error('getProductById 错误:', error);
      return { code: 500, message: '网络错误' };
    }
  },

  // 创建商品
  createProduct: async (product: Product): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();
    try {
      const response = await fetch(`${API_BASE_URL}/api/crud/product/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "INSERT",
          name: product.name,
          description: product.description || '',
          price: product.price,
          original_price: product.original_price || product.price,
          category: product.category,
          stock: product.stock,
          images: product.images || '',
          status: product.status || 'on',
          sales: 0
        })
      });
      return await response.json();
    } catch (error) {
      console.error('createProduct 错误:', error);
      return { code: 500, message: '网络错误' };
    }
  },

  // 更新商品
  updateProduct: async (id: number, product: Partial<Product>): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();
    
    const updateData: any = {};
    if (product.name !== undefined) updateData.name = product.name;
    if (product.description !== undefined) updateData.description = product.description;
    if (product.price !== undefined) updateData.price = product.price;
    if (product.original_price !== undefined) updateData.original_price = product.original_price;
    if (product.category !== undefined) updateData.category = product.category;
    if (product.stock !== undefined) updateData.stock = product.stock;
    if (product.images !== undefined) updateData.images = product.images;
    if (product.status !== undefined) updateData.status = product.status;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/crud/product/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "UPDATE",
          id: id,
          ...updateData
        })
      });
      const result = await response.json();
      console.log('更新响应:', result);
      return result;
    } catch (error) {
      console.error('updateProduct 错误:', error);
      return { code: 500, message: '网络错误' };
    }
  },

  // 删除商品
  deleteProduct: async (id: number): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/crud/product/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "DELETE",
          id: id
        })
      });
      const result = await response.json();
      console.log('删除响应:', result);
      return result;
    } catch (error) {
      console.error('deleteProduct 错误:', error);
      return { code: 500, message: '网络错误' };
    }
  }
};

export default productAPI;