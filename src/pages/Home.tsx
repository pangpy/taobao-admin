import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Carousel, Statistic, Card } from 'antd';
import { ShoppingOutlined, DollarOutlined, TeamOutlined, RocketOutlined } from '@ant-design/icons';
import ProductCard from '../components/Product/ProductCard';
import { productAPI } from '../api/product';
import { Product } from '../types';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getProducts();
      if (res.rows) {
        setProducts(res.rows.slice(0, 8));
      }
    } catch (error) {
      console.error('获取商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const banners = [
    { id: 1, title: '618=大促', subtitle: '全场5折起', image: 'https://picsum.photos/id/20/1200/400' },
    { id: 2, title: '新品上市', subtitle: '限时优惠', image: 'https://picsum.photos/id/21/1200/400' },
    { id: 3, title: '爆款推荐', subtitle: '热销榜单', image: 'https://picsum.photos/id/22/1200/400' },
  ];

  const stats = [
    { title: '商品总数', value: 128, icon: <ShoppingOutlined />, color: 'blue' },
    { title: '今日销量', value: 456, icon: <RocketOutlined />, color: 'green' },
    { title: '销售额', value: 12800, icon: <DollarOutlined />, color: 'orange' },
    { title: '用户数', value: 3280, icon: <TeamOutlined />, color: 'purple' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Spin size="large" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <Carousel autoplay effect="fade" className="rounded-xl overflow-hidden">
        {banners.map((banner) => (
          <div key={banner.id}>
            <div className="relative h-80">
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-4xl font-bold mb-4">{banner.title}</h2>
                  <p className="text-xl">{banner.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="text-center">
            <div className={`text-3xl mb-2 text-${stat.color}-600`}>{stat.icon}</div>
            <Statistic title={stat.title} value={stat.value} />
          </Card>
        ))}
      </div>

      {/* 推荐商品 */}
      <section>
        <h2 className="text-2xl font-bold mb-6">🔥 热门推荐</h2>
        <Row gutter={[16, 16]}>
          {products.map((product) => (
            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      </section>
    </div>
  );
};

export default Home;
