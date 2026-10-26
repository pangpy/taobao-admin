import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Spin, Carousel, Statistic, Card, Alert } from 'antd';
import { ShoppingOutlined, DollarOutlined, TeamOutlined, RocketOutlined } from '@ant-design/icons';
import ProductCard from '../components/Product/ProductCard';
import { productAPI } from '../api/product';
import { Product } from '../types';
import { getDynamicHeaders } from '../api/sdkHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.apiscode.org';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  sort_order?: number;
  status?: string;
}

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [bannerError, setBannerError] = useState<string | null>(null);

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

  const fetchBanners = useCallback(async (isRetry = false) => {
    setBannerLoading(true);
    setBannerError(null);
    try {
      const headers = await getDynamicHeaders();
      const res = await fetch(`${API_BASE_URL}/api/crud/banner/direct`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SELECT' }),
      });

      // 首次 401：等 token 就绪后自动重试一次（不无限重试）
      if (res.status === 401 && !isRetry) {
        await new Promise((r) => setTimeout(r, 500));
        return fetchBanners(true);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      const rows = data?.rows || data?.result?.data || [];
      const active = rows
        .filter((b: Banner) => b.status !== 'off')
        .sort((a: Banner, b: Banner) => (a.sort_order || 0) - (b.sort_order || 0));
      setBanners(active);
    } catch (error: any) {
      console.error('获取 Banner 失败:', error);
      setBanners([]);
      setBannerError(error?.message || '获取 Banner 失败');
    } finally {
      setBannerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchBanners();
  }, [fetchBanners]);

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
      {bannerLoading ? (
        <div className="flex justify-center items-center h-80"><Spin size="large" /></div>
      ) : bannerError ? (
        <Alert
          type="error"
          showIcon
          message="Banner 加载失败"
          description={bannerError}
          action={<a onClick={() => fetchBanners()}>重试</a>}
        />
      ) : banners.length === 0 ? (
        <Alert type="warning" showIcon message="暂无 Banner 数据" />
      ) : (
        <Carousel autoplay effect="fade" className="rounded-xl overflow-hidden">
          {banners.map((banner) => (
            <div key={banner.id}>
              <div className="relative h-80">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
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
      )}

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
