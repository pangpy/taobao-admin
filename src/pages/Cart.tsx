// src/pages/Cart.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, InputNumber, message, Popconfirm, Card, Empty, Spin } from 'antd';
import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { cartAPI } from '../api/cart';
import { CartItem } from '../types';

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.id) {
      fetchCart();
    }
  }, [user.id]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartAPI.getCart(user.id);
      console.log('购物车API返回原始数据:', res);
      
      let items = [];
      
      // 多种格式兼容
      if (res.code === 200) {
        // 格式1: res.result.data
        if (res.result && res.result.data && Array.isArray(res.result.data)) {
          items = res.result.data;
        }
        // 格式2: res.rows
        else if (res.rows && Array.isArray(res.rows)) {
          items = res.rows;
        }
        // 格式3: res.data
        else if (res.data && Array.isArray(res.data)) {
          items = res.data;
        }
        // 格式4: 直接是数组
        else if (Array.isArray(res)) {
          items = res;
        }
      }
      
      console.log('解析后的购物车数据:', items);
      setCartItems(items);
    } catch (error) {
      console.error('获取购物车失败:', error);
      message.error('获取购物车失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    try {
      const res = await cartAPI.updateCart(id, quantity);
      if (res.code === 200) {
        message.success('更新成功');
        fetchCart();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      message.error('更新失败');
    }
  };

  const handleRemove = async (id: number) => {
    try {
      const res = await cartAPI.removeFromCart(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchCart();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleCheckout = async () => {
    message.info('结算功能开发中...');
  };

  const columns = [
    { 
      title: '商品图片', 
      dataIndex: 'product_image', 
      key: 'product_image',
      width: 80,
      render: (img: string) => img ? (
        <img 
          src={img} 
          alt="商品" 
          className="w-12 h-12 object-cover rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/4F46E5/white?text=No+Img';
          }}
        />
      ) : (
        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs">无图</div>
      )
    },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { 
      title: '价格', 
      dataIndex: 'product_price', 
      key: 'product_price', 
      render: (price: number) => `¥${Number(price).toFixed(2)}` 
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (quantity: number, record: CartItem) => (
        <InputNumber
          min={1}
          max={99}
          value={quantity}
          onChange={(value) => handleUpdateQuantity(record.id!, value || 1)}
        />
      )
    },
    {
      title: '小计',
      key: 'subtotal',
      width: 100,
      render: (_: any, record: CartItem) => `¥${(Number(record.product_price) * record.quantity).toFixed(2)}`
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: CartItem) => (
        <Popconfirm title="确定删除吗？" onConfirm={() => handleRemove(record.id!)}>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      )
    }
  ];

  const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.product_price) * item.quantity, 0);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">购物车</h1>
        <div className="flex justify-center items-center h-64"><Spin size="large" /></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">购物车</h1>
        <Empty description="购物车空空如也">
          <Button type="primary" onClick={() => window.location.href = '/products'}>
            去购物
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">购物车</h1>
      <Table 
        columns={columns} 
        dataSource={cartItems} 
        rowKey="id" 
        loading={loading} 
        pagination={false}
        scroll={{ x: 800 }}
      />
      <Card className="mt-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg">总计：</span>
            <span className="text-2xl font-bold text-red-500">¥{totalPrice.toFixed(2)}</span>
          </div>
          <Button type="primary" size="large" icon={<ShoppingOutlined />} onClick={handleCheckout}>
            去结算
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Cart;