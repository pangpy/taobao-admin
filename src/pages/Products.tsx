import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Tag, Image, Card, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { productAPI } from '../api/product';
import { cartAPI } from '../api/cart';
import { Product } from '../types';

const { Option } = Select;

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useOutletContext<{ isMobile: boolean }>() || { isMobile: false };
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

  // ========== PC 端表格列定义 ==========
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
      width: 240,
      render: (_: any, record: Product) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button 
            type="link" 
            size="small"
            icon={<ShoppingCartOutlined />} 
            onClick={() => handleAddToCart(record)}
            disabled={record.stock <= 0}
          >
            {record.stock > 0 ? '加购' : '缺货'}
          </Button>
          <Popconfirm 
            title="确定删除吗？" 
            onConfirm={() => handleDelete(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // ========== 移动端卡片组件 ==========
  const MobileProductCard = ({ product }: { product: Product }) => {
    const imageUrl = getImageUrl(product.images);
    
    return (
      <Card 
        className="mb-3 rounded-xl shadow-sm"
        bodyStyle={{ padding: '12px' }}
      >
        <div className="flex gap-3">
          {/* 商品图片 */}
          <div className="w-20 h-20 flex-shrink-0">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/4F46E5/white?text=商品';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                无图
              </div>
            )}
          </div>
          
          {/* 商品信息 */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base text-gray-800 truncate">
              {product.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              分类：{product.category || '未分类'}
            </div>
            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
              <span className="text-red-500 text-lg font-bold">
                ¥{product.price?.toFixed(2)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-gray-400 text-xs line-through">
                  ¥{product.original_price.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>库存：{product.stock}</span>
              <span>销量：{product.sales || 0}</span>
              <Tag color={product.status === 'on' ? 'green' : 'red'} className="m-0">
                {product.status === 'on' ? '在售' : '下架'}
              </Tag>
            </div>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <Button 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(product)}
            className="flex-1"
          >
            编辑
          </Button>
          <Button 
            size="small"
            icon={<ShoppingCartOutlined />}
            onClick={() => handleAddToCart(product)}
            disabled={product.stock <= 0}
            type={product.stock > 0 ? 'primary' : 'default'}
            className="flex-1"
          >
            {product.stock > 0 ? '加入购物车' : '缺货'}
          </Button>
          <Popconfirm 
            title="确定删除吗？" 
            onConfirm={() => handleDelete(product.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              size="small"
              danger
              icon={<DeleteOutlined />}
              className="flex-1"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      </Card>
    );
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      {/* 头部 */}
      <div className={`mb-4 flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'}`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>商品管理</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          block={isMobile}
        >
          添加商品
        </Button>
      </div>

      {/* 根据设备类型显示不同视图 */}
      {isMobile ? (
        // 移动端：卡片列表
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              暂无商品数据
              <div className="mt-2">
                <Button type="link" onClick={handleAdd}>点击添加商品</Button>
              </div>
            </div>
          ) : (
            products.map((product) => (
              <MobileProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      ) : (
        // PC 端：表格
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          locale={{ emptyText: '暂无商品数据，点击"添加商品"创建' }}
          scroll={{ x: 1100 }}
        />
      )}

      {/* 添加/编辑商品弹窗 */}
      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="商品描述"
          >
            <Input.TextArea rows={4} placeholder="请输入商品描述" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Option value="电子产品">电子产品</Option>
              <Option value="服装">服装</Option>
              <Option value="食品">食品</Option>
              <Option value="图书">图书</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              prefix="¥"
              placeholder="请输入价格"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="original_price"
            label="原价"
          >
            <InputNumber
              min={0}
              precision={2}
              prefix="¥"
              placeholder="请输入原价（可选）"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="stock"
            label="库存"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <InputNumber
              min={0}
              placeholder="请输入库存数量"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="images"
            label="图片地址"
          >
            <Input placeholder="请输入图片地址，多个用逗号分隔" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择商品状态">
              <Option value="on">在售</Option>
              <Option value="off">下架</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
