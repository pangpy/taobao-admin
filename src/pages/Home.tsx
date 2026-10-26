import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Spin, Carousel, Statistic, Card, Alert } from 'antd';
import { ShoppingOutlined, DollarOutlined, TeamOutlined, RocketOutlined } from '@ant-design/icons';
import ProductCard from '../components/Product/ProductCard';
import { Product } from '../types';
import { getDynamicHeaders } from '../api/sdkHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.apiscode.org';

// ===== 类型 =====
interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  sort_order?: number;
  status?: string;
}

interface BlockDataSource {
  api?: string | null;
  method?: string;
  body?: Record<string, any>;
}

interface Block {
  id: number;
  page: string;
  block_type: string;
  block_order: number;
  props: string;        // JSON 字符串
  data_source: string;  // JSON 字符串
  status?: string;
}

// ===== 通用请求（带 401 自动重试）=====
const apiFetch = async (path: string, body: any, isRetry = false): Promise<any> => {
  const headers = await getDynamicHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401 && !isRetry) {
    await new Promise((r) => setTimeout(r, 500));
    return apiFetch(path, body, true);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
};

// ===== 各 Block 组件 =====
const BannerBlock: React.FC<{ props: any; dataSource: BlockDataSource }> = ({ props, dataSource }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(dataSource.api || '/api/crud/banner/direct', dataSource.body || { type: 'SELECT' });
      const rows = data?.rows || data?.result?.data || [];
      const active = rows
        .filter((b: Banner) => b.status !== 'off')
        .sort((a: Banner, b: Banner) => (a.sort_order || 0) - (b.sort_order || 0));
      setBanners(active);
    } catch (e: any) {
      setError(e?.message || '获取 Banner 失败');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [dataSource.api, dataSource.body]);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  if (loading) return <div className="flex justify-center items-center h-80"><Spin size="large" /></div>;
  if (error) return <Alert type="error" showIcon message="Banner 加载失败" description={error} action={<a onClick={fetchBanners}>重试</a>} />;
  if (banners.length === 0) return <Alert type="warning" showIcon message="暂无 Banner 数据" />;

  return (
    <Carousel autoplay={props?.autoplay !== false} effect="fade" className="rounded-xl overflow-hidden">
      {banners.map((banner) => (
        <div key={banner.id}>
          <div className="relative" style={{ height: props?.height || 320 }}>
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
  );
};

const StatsBlock: React.FC<{ props: any }> = ({ props }) => {
  const iconMap: Record<string, React.ReactNode> = {
    ShoppingOutlined: <ShoppingOutlined />,
    RocketOutlined: <RocketOutlined />,
    DollarOutlined: <DollarOutlined />,
    TeamOutlined: <TeamOutlined />,
  };
  const items = props?.items || [];
  const cols = props?.cols || 4;
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-4`}>
      {items.map((stat: any, idx: number) => (
        <Card key={idx} className="text-center">
          <div className={`text-3xl mb-2 text-${stat.color}-600`}>{iconMap[stat.icon] || null}</div>
          <Statistic title={stat.title} value={stat.value} />
        </Card>
      ))}
    </div>
  );
};

const ProductGridBlock: React.FC<{ props: any; dataSource: BlockDataSource }> = ({ props, dataSource }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(dataSource.api || '/api/crud/product/direct', dataSource.body || { type: 'SELECT' });
      const rows = data?.rows || data?.result?.data || [];
      setProducts(rows.slice(0, props?.limit || 8));
    } catch (e: any) {
      setError(e?.message || '获取商品失败');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [dataSource.api, dataSource.body, props?.limit]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  if (loading) return <div className="flex justify-center items-center h-40"><Spin /></div>;
  if (error) return <Alert type="error" showIcon message="商品加载失败" description={error} action={<a onClick={fetchProducts}>重试</a>} />;

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{props?.title || '热门推荐'}</h2>
      <Row gutter={[16, 16]}>
        {products.map((product) => (
          <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
            <ProductCard product={product} />
          </Col>
        ))}
      </Row>
    </section>
  );
};

// ===== Block 映射 =====
const BLOCK_COMPONENTS: Record<string, React.FC<{ props: any; dataSource: BlockDataSource }>> = {
  banner: BannerBlock,
  stats: StatsBlock,
  'product-grid': ProductGridBlock,
};

// ===== 主页面 =====
const Home: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLayout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/crud/layout/direct', { type: 'SELECT', page: 'home' });
      const rows = data?.rows || data?.result?.data || [];
      const active = rows
        .filter((b: Block) => b.status !== 'off')
        .sort((a: Block, b: Block) => (a.block_order || 0) - (b.block_order || 0));
      setBlocks(active);
    } catch (e: any) {
      setError(e?.message || '获取布局失败');
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLayout(); }, [fetchLayout]);

  if (loading) return <div className="flex justify-center items-center h-96"><Spin size="large" /></div>;
  if (error) return <Alert type="error" showIcon message="页面加载失败" description={error} action={<a onClick={fetchLayout}>重试</a>} />;

  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        const Comp = BLOCK_COMPONENTS[block.block_type];
        if (!Comp) {
          console.warn('未知 block_type:', block.block_type);
          return null;
        }
        let props: any = {};
        let dataSource: BlockDataSource = {};
        try { props = JSON.parse(block.props || '{}'); } catch {}
        try { dataSource = JSON.parse(block.data_source || '{}'); } catch {}
        return <Comp key={block.id} props={props} dataSource={dataSource} />;
      })}
    </div>
  );
};

export default Home;
