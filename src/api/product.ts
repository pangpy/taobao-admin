import { Product, ApiResponse } from '../types';
import { getDynamicHeaders } from './sdkHelper';

export const productAPI = {
  // 获取商品列表
  getProducts: async (params?: any): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const body: any = { type: "SELECT" };
    
    if (params?.category) body.category = params.category;
    if (params?.status) body.status = params.status;
    if (params?.search) body.name = params.search;
    
    const response = await fetch('https://api.apiscode.org/api/crud/product/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  },

  // 获取单个商品
  getProductById: async (id: number): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const response = await fetch('https://api.apiscode.org/api/crud/product/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "SELECT",
        id: id
      })
    });
    return await response.json();
  },

  // 创建商品
  createProduct: async (product: Product): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const response = await fetch('https://api.apiscode.org/api/crud/product/direct', {
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
  },

  // 更新商品
  updateProduct: async (id: number, product: Partial<Product>): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const updateData: any = { type: "UPDATE", id: id };
    
    if (product.name) updateData.name = product.name;
    if (product.description) updateData.description = product.description;
    if (product.price) updateData.price = product.price;
    if (product.original_price) updateData.original_price = product.original_price;
    if (product.category) updateData.category = product.category;
    if (product.stock !== undefined) updateData.stock = product.stock;
    if (product.images) updateData.images = product.images;
    if (product.status) updateData.status = product.status;
    
    const response = await fetch('https://api.apiscode.org/api/crud/product/direct', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return await response.json();
  },

  // 删除商品
  deleteProduct: async (id: number): Promise<ApiResponse> => {
    const headers = await getDynamicHeaders();  // 改这里
    const response = await fetch('https://api.apiscode.org/api/crud/product/direct', {
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

export default productAPI;