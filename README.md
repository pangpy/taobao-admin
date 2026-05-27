# 淘宝商家后台管理系uuuuuuuuu

## 项目介绍

基于 React + TypeScript + Ant Design + FastAPI 的电商后台管理系统。

## 技术栈

### 前端
- React 18
- TypeScript
- Ant Design 5
- Vite
- React Router v6

### 后端
- FastAPI
- PostgreSQL
- SQLAlchemy
- 动态表结构

## 数据表设计

### 1. 用户表 (user)

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| id | BIGINT | 用户ID（自增主键） | 是 |
| username | VARCHAR(50) | 用户名 | 是 |
| email | VARCHAR(100) | 邮箱 | 是 |
| password | VARCHAR(255) | 密码 | 是 |
| phone | VARCHAR(20) | 手机号 | 否 |
| avatar | VARCHAR(255) | 头像URL | 否 |
| role | ENUM | 角色：admin、user、guest | 是 |
| status | ENUM | 状态：active、disabled、banned | 是 |
| last_login_time | TIMESTAMP | 最后登录时间 | 否 |
| create_time | TIMESTAMP | 创建时间 | 自动 |
| remark | TEXT | 备注 | 否 |

### 2. 商品表 (product)

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| id | BIGINT | 商品ID（自增主键） | 是 |
| name | VARCHAR(200) | 商品名称 | 是 |
| description | TEXT | 商品描述 | 否 |
| price | DECIMAL(10,2) | 售价 | 是 |
| original_price | DECIMAL(10,2) | 原价 | 否 |
| category | VARCHAR(50) | 商品分类 | 是 |
| stock | INTEGER | 库存数量 | 是 |
| images | VARCHAR(2000) | 商品图片URL | 否 |
| sales | INTEGER | 销量 | 否 |
| status | ENUM | 状态：on（上架）、off（下架） | 否 |
| user_id | BIGINT | 商家ID | 否 |
| create_time | TIMESTAMP | 创建时间 | 自动 |
| update_time | TIMESTAMP | 更新时间 | 自动 |

### 3. 订单表 (order)

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| id | BIGINT | 订单ID（自增主键） | 是 |
| order_no | VARCHAR(32) | 订单号 | 是 |
| user_id | BIGINT | 用户ID | 是 |
| total_amount | DECIMAL(10,2) | 订单总金额 | 是 |
| pay_amount | DECIMAL(10,2) | 实付金额 | 是 |
| order_status | ENUM | 订单状态：pending、paid、shipped、completed、cancelled | 是 |
| pay_status | ENUM | 支付状态：unpaid、paid、refunded | 是 |
| shipping_status | ENUM | 发货状态：unshipped、shipped、delivered | 否 |
| receiver_name | VARCHAR(50) | 收货人姓名 | 是 |
| receiver_phone | VARCHAR(20) | 收货人电话 | 是 |
| receiver_address | VARCHAR(255) | 收货地址 | 是 |
| payment_time | TIMESTAMP | 支付时间 | 否 |
| shipping_time | TIMESTAMP | 发货时间 | 否 |
| finish_time | TIMESTAMP | 完成时间 | 否 |
| cancel_time | TIMESTAMP | 取消时间 | 否 |
| remark | TEXT | 备注 | 否 |
| create_time | TIMESTAMP | 创建时间 | 自动 |
| update_time | TIMESTAMP | 更新时间 | 自动 |

### 4. 订单详情表 (order_item)

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| id | BIGINT | 详情ID（自增主键） | 是 |
| order_id | BIGINT | 订单ID | 是 |
| product_id | BIGINT | 商品ID | 是 |
| product_name | VARCHAR(200) | 商品名称（快照） | 是 |
| product_price | DECIMAL(10,2) | 商品单价（快照） | 是 |
| quantity | INTEGER | 购买数量 | 是 |
| total_price | DECIMAL(10,2) | 小计金额 | 是 |
| create_time | TIMESTAMP | 创建时间 | 自动 |

### 5. 购物车表 (cart)

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| id | BIGINT | 购物车ID（自增主键） | 是 |
| user_id | BIGINT | 用户ID | 是 |
| product_id | BIGINT | 商品ID | 是 |
| product_name | VARCHAR(200) | 商品名称 | 是 |
| product_price | DECIMAL(10,2) | 商品价格 | 是 |
| quantity | INTEGER | 数量 | 是 |
| product_image | VARCHAR(255) | 商品图片 | 否 |
| selected | BOOLEAN | 是否选中 | 否 |
| create_time | TIMESTAMP | 创建时间 | 自动 |
| update_time | TIMESTAMP | 更新时间 | 自动 |

## 字段类型说明

### 常用类型

| 类型 | 说明 | 示例 |
|------|------|------|
| VARCHAR(n) | 变长字符串，最大长度 n | VARCHAR(255) |
| TEXT | 长文本，无长度限制 | TEXT |
| INTEGER | 整数（-2^31 到 2^31-1） | INTEGER |
| BIGINT | 长整数（-2^63 到 2^63-1） | BIGINT |
| DECIMAL(p,s) | 精确小数，p为总位数，s为小数位 | DECIMAL(10,2) |
| BOOLEAN | 布尔值 | BOOLEAN |
| TIMESTAMP | 时间戳 | TIMESTAMP |
| DATE | 日期 | DATE |
| ENUM | 枚举类型 | ENUM('A','B','C') |

### ENUM 枚举值示例

```sql
-- 订单状态
ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled')

-- 支付状态
ENUM('unpaid', 'paid', 'refunded')

-- 商品状态
ENUM('on', 'off')

-- 用户状态
ENUM('active', 'disabled', 'banned')