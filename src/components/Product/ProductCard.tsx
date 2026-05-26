import React from 'react';
import { Card, Button, Tag, InputNumber, message } from 'antd';
import { ShoppingCartOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isAdmin = false,
  onEdit, 
  onDelete,
  onAddToCart 
}) => {
  const [quantity, setQuantity] = React.useState(1);

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      message.error(`库存不足，当前库存: ${product.stock}`);
      return;
    }
    onAddToCart?.(product, quantity);
  };

  return (
    <Card
      hoverable
      className="w-full mb-4 transition-all duration-300 hover:shadow-xl"
      cover={
        <div className="h-48 overflow-hidden bg-gray-100">
          <img
            alt={product.name}
            src={product.images || `https://picsum.photos/id/${product.id}/300/200`}
            className="w-full h-full object-cover"
          />
        </div>
      }
      actions={isAdmin ? [
        <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => onEdit?.(product)}>
          编辑
        </Button>,
        <Button key="delete" type="link" danger icon={<DeleteOutlined />} onClick={() => onDelete?.(product.id!)}>
          删除
        </Button>,
      ] : [
        <div key="cart" className="flex items-center justify-center gap-2">
          <InputNumber
            min={1}
            max={product.stock}
            value={quantity}
            onChange={(value) => setQuantity(value || 1)}
            size="small"
            className="w-20"
          />
          <Button type="primary" icon={<ShoppingCartOutlined />} onClick={handleAddToCart}>
            加入购物车
          </Button>
        </div>
      ]}
    >
      <div className="mb-2">
        <Tag color="blue">{product.category}</Tag>
        {product.status === 'on' ? (
          <Tag color="green">在售</Tag>
        ) : (
          <Tag color="red">下架</Tag>
        )}
      </div>
      
      <Card.Meta
        title={
          <div className="text-lg font-semibold line-clamp-1">{product.name}</div>
        }
        description={
          <div>
            <p className="text-gray-600 text-sm line-clamp-2 mt-2">{product.description}</p>
            <div className="mt-3">
              <span className="text-2xl font-bold text-red-500">¥{product.price}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-gray-400 text-sm line-through ml-2">
                  ¥{product.original_price}
                </span>
              )}
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>销量: {product.sales || 0}</span>
              <span>库存: {product.stock}</span>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default ProductCard;
