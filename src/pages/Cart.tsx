import React, { useState, useEffect } from 'react';
import { Table, Button, InputNumber, message, Popconfirm, Card, Empty } from 'antd';
import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { cartAPI } from '../api/cart';
import { orderAPI } from '../api/order';
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
      if (res.rows) {
        setCartItems(res.rows);
      }
    } catch (error) {
      message.error('获取购物车失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    try {
      await cartAPI.updateCart(id, quantity);
      message.success('更新成功');
      fetchCart();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await cartAPI.removeFromCart(id);
      message.success('删除成功');
      fetchCart();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleCheckout = async () => {
    message.info('结算功能开发中...');
  };

  const columns = [
    { title: '商品名称', dataIndex: 'product_name', key: 'name' },
    { title: '价格', dataIndex: 'product_price', key: 'price', render: (price: number) => `¥${price}` },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
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
      render: (_: any, record: CartItem) => `¥${(record.product_price || 0) * record.quantity}`
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CartItem) => (
        <Popconfirm title="确定删除吗？" onConfirm={() => handleRemove(record.id!)}>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      )
    }
  ];

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product_price || 0) * item.quantity, 0);

  if (cartItems.length === 0) {
    return <Empty description="购物车空空如也" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">购物车</h1>
      <Table columns={columns} dataSource={cartItems} rowKey="id" loading={loading} pagination={false} />
      <Card className="mt-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg">总计：</span>
            <span className="text-2xl font-bold text-red-500">¥{totalPrice}</span>
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
