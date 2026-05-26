import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { productAPI } from '../api/product';
import { Product } from '../types';

const { Option } = Select;

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getProducts();
      if (res.rows) {
        setProducts(res.rows);
      }
    } catch (error) {
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await productAPI.deleteProduct(id);
      message.success('删除成功');
      fetchProducts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct.id!, values);
        message.success('更新成功');
      } else {
        await productAPI.createProduct(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchProducts();
    } catch (error) {
      message.error(editingProduct ? '更新失败' : '添加失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    { title: '价格', dataIndex: 'price', key: 'price', width: 100, render: (price: number) => `¥${price}` },
    { title: '库存', dataIndex: 'stock', key: 'stock', width: 80 },
    { title: '销量', dataIndex: 'sales', key: 'sales', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'on' ? 'green' : 'red'}>{status === 'on' ? '在售' : '下架'}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Product) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id!)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加商品
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select>
              <Option value="电子产品">电子产品</Option>
              <Option value="服装鞋包">服装鞋包</Option>
              <Option value="家居用品">家居用品</Option>
              <Option value="食品饮料">食品饮料</Option>
            </Select>
          </Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} className="w-full" />
          </Form.Item>
          <Form.Item name="original_price" label="原价">
            <InputNumber min={0} precision={2} className="w-full" />
          </Form.Item>
          <Form.Item name="stock" label="库存" rules={[{ required: true }]}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Option value="on">在售</Option>
              <Option value="off">下架</Option>
            </Select>
          </Form.Item>
          <Form.Item name="images" label="图片URL">
            <Input placeholder="商品图片链接" />
          </Form.Item>
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
