// pages/Orders.tsx
import React, { useState, useEffect } from 'react';
import { Table, Tag, message } from 'antd';  // 移除未使用的 Button
import { orderAPI } from '../api/order';
import { Order } from '../types';
// 手动触发部署 - 2026-05-27  ✅ 添加这行注释
const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.id) {
      fetchOrders();
    }
  }, [user.id]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getOrders(user.id);
      if (res.rows) {
        setOrders(res.rows);
      }
    } catch (error) {
      message.error('获取订单失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: any = {
      pending: { color: 'orange', text: '待付款' },
      paid: { color: 'blue', text: '已付款' },
      shipped: { color: 'cyan', text: '已发货' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' }
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '总价', dataIndex: 'total_price', key: 'total_price', render: (price: number) => `¥${price}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '下单时间', dataIndex: 'created_at', key: 'created_at' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>
      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  );
};

export default Orders;