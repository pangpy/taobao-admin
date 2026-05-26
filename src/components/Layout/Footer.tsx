import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p>© 2024 网店商家后台管理系统 | 版权所有</p>
        <p className="text-gray-400 text-sm mt-2">提供商品管理、订单管理、购物车等功能</p>
      </div>
    </footer>
  );
};

export default Footer;
