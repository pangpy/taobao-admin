import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Tag, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { productAPI } from '../api/product';
import { cartAPI } from '../api/cart';
import { Product } from '../types';

const { Option } = Select;

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    fetchProducts();
  }, []);

  // 安全转换数字
  const toNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // 获取商品列表
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res: any = await productAPI.getProducts();
      console.log('商品列表API返回:', res);
      
      let rawData = [];
      // 兼容多种返回格式
      if (res.code === 200) {
        if (res.result && res.result.data) {
          rawData = res.result.data;
        } else if (res.rows) {
          rawData = res.rows;
        } else if (res.data) {
          rawData = Array.isArray(res.data) ? res.data : [];
        }
      } else if (res.rows) {
        rawData = res.rows;
      } else if (res.data) {
        rawData = Array.isArray(res.data) ? res.data : [];
      }
      
      const formattedData = rawData.map((item: any) => ({
        ...item,
        id: toNumber(item.id),
        price: toNumber(item.price),
        original_price: toNumber(item.original_price),
        stock: toNumber(item.stock),
        sales: toNumber(item.sales),
      }));
      
      setProducts(formattedData);
    } catch (error) {
      console.error('获取商品列表失败:', error);
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加入购物车
  const handleAddToCart = async (product: Product) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userStr);
    if (!user.id) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    
    // 检查库存
    if (product.stock <= 0) {
      message.warning('商品库存不足');
      return;
    }
    
    try {
      const res = await cartAPI.addToCart({
        user_id: user.id,
        product_id: product.id!,
        product_name: product.name,
        product_price: product.price,
        quantity: 1,
        product_image: product.images?.split(',')[0] || ''
      });
      
      console.log('加入购物车响应:', res);
      
      if (res && res.code === 200) {
        message.success('已添加到购物车');
      } else {
        message.error(res?.message || '添加失败');
      }
    } catch (error) {
      console.error('加入购物车失败:', error);
      message.error('添加失败，请重试');
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'on',
      stock: 0,
      price: 0,
      original_price: 0
    });
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        original_price: product.original_price,
        stock: product.stock,
        status: product.status || 'on',
        images: product.images
      });
    }, 50);
  };

  const handleDelete = async (id: number) => {
    console.log('=== 删除商品 ===');
    console.log('商品 ID:', id);
    
    try {
      const res = await productAPI.deleteProduct(id);
      console.log('删除响应:', res);
      
      if (res && res.code === 200) {
        message.success('删除成功');
        fetchProducts();
      } else {
        message.error(res?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    console.log('=== 提交商品数据 ===');
    console.log('编辑模式:', !!editingProduct);
    console.log('表单数据:', values);
    
    try {
      const submitData = {
        ...values,
        price: Number(values.price),
        original_price: Number(values.original_price) || Number(values.price),
        stock: Number(values.stock),
      };
      console.log('提交数据:', submitData);
      
      let res;
      if (editingProduct) {
        console.log('执行更新操作, ID:', editingProduct.id);
        res = await productAPI.updateProduct(editingProduct.id!, submitData);
        console.log('更新响应:', res);
        
        if (res && res.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchProducts();
        } else {
          message.error(res?.message || '更新失败');
        }
      } else {
        console.log('执行创建操作');
        res = await productAPI.createProduct(submitData);
        console.log('创建响应:', res);
        
        if (res && res.code === 200) {
          message.success('添加成功');
          setModalVisible(false);
          fetchProducts();
        } else {
          message.error(res?.message || '添加失败');
        }
      }
    } catch (error) {
      console.error('提交失败:', error);
      message.error(editingProduct ? '更新失败' : '添加失败');
    }
  };

  // 获取图片URL
  const getImageUrl = (images: string | undefined) => {
    if (!images) return null;
    const firstImage = images.split(',')[0].trim();
    return firstImage || null;
  };

  const columns = [
    {
      title: '图片',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: string) => {
        const imageUrl = getImageUrl(images);
        if (!imageUrl) {
          return (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
              无图
            </div>
          );
        }
        return (
          <Image
            src={imageUrl}
            alt="商品图片"
            width={48}
            height={48}
            className="object-cover rounded-lg"
            fallback="https://placehold.co/48x48/4F46E5/white?text=Error"
            preview={{ mask: <EyeOutlined /> }}
          />
        );
      }
    },
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '商品名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    { 
      title: '价格', 
      dataIndex: 'price', 
      key: 'price', 
      width: 100, 
      render: (price: number) => {
        const num = typeof price === 'number' ? price : Number(price);
        return isNaN(num) ? '¥0.00' : `¥${num.toFixed(2)}`;
      }
    },
    { 
      title: '原价', 
      dataIndex: 'original_price', 
      key: 'original_price', 
      width: 100, 
      render: (price: number) => {
        if (!price && price !== 0) return '-';
        const num = typeof price === 'number' ? price : Number(price);
        return isNaN(num) ? '-' : `¥${num.toFixed(2)}`;
      }
    },
    { title: '库存', dataIndex: 'stock', key: 'stock', width: 80 },
    { title: '销量', dataIndex: 'sales', key: 'sales', width: 80, render: (sales: number) => sales || 0 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'on' ? 'green' : 'red'}>
          {status === 'on' ? '在售' : '下架'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: Product) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<ShoppingCartOutlined />} 
            onClick={() => handleAddToCart(record)}
            disabled={record.stock <= 0}
          >
            {record.stock > 0 ? '加入购物车' : '缺货'}
          </Button>
          <Popconfirm 
            title="确定删除吗？" 
            onConfirm={() => handleDelete(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
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
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        locale={{ emptyText: '暂无商品数据，点击"添加商品"创建' }}
      />

      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form 
          form={form}
          layout="vertical" 
          onFinish={handleSubmit}
          initialValues={{
            status: 'on',
            stock: 0,
            price: 0,
            original_price: 0
          }}
        >
          <Form.Item 
            name="name" 
            label="商品名称" 
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>
          
          <Form.Item 
            name="category" 
            label="分类" 
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Option value="电子产品">电子产品</Option>
              <Option value="服装鞋包">服装鞋包</Option>
              <Option value="家居用品">家居用品</Option>
              <Option value="食品饮料">食品饮料</Option>
              <Option value="美妆个护">美妆个护</Option>
              <Option value="母婴用品">母婴用品</Option>
            </Select>
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="price" 
              label="售价" 
              rules={[{ required: true, message: '请输入售价' }]}
            >
              <InputNumber 
                min={0} 
                precision={2} 
                className="w-full" 
                placeholder="0.00"
                prefix="¥"
              />
            </Form.Item>
            
            <Form.Item name="original_price" label="原价">
              <InputNumber 
                min={0} 
                precision={2} 
                className="w-full" 
                placeholder="0.00"
                prefix="¥"
              />
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="stock" 
              label="库存" 
              rules={[{ required: true, message: '请输入库存' }]}
            >
              <InputNumber min={0} className="w-full" placeholder="0" />
            </Form.Item>
            
            <Form.Item 
              name="status" 
              label="状态" 
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Option value="on">在售</Option>
                <Option value="off">下架</Option>
              </Select>
            </Form.Item>
          </div>
          
          <Form.Item 
            name="images" 
            label="图片URL" 
            tooltip="支持单张图片或多张图片（用逗号分隔）"
          >
            <Input.TextArea 
              rows={2} 
              placeholder="https://placehold.co/300x300/4F46E5/white?text=Product" 
            />
          </Form.Item>
          
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? '保存修改' : '添加商品'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;