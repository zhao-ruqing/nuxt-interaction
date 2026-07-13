export interface ProductSpec {
  size: string
  price: number
}

export interface Product {
  id: number
  name: string
  category: string
  categoryName: string
  price: number
  originalPrice?: number
  description: string
  image: string
  tags: string[]
  rating: number
  sales: number
  stock: number
  specs: ProductSpec[]
  ingredients?: string[]
}

export const categories = [
  { key: 'all', name: '全部' },
  { key: 'coffee', name: '咖啡' },
  { key: 'soda', name: '汽水' },
  { key: 'tea', name: '茶饮' },
  { key: 'juice', name: '果汁' },
  { key: 'milk', name: '奶茶' },
]

export const products: Product[] = [
  {
    id: 1,
    name: '经典美式咖啡',
    category: 'coffee',
    categoryName: '咖啡',
    price: 18,
    originalPrice: 22,
    description: '精选阿拉比卡咖啡豆，中深度烘焙，口感醇厚顺滑，带有淡淡的坚果与巧克力香气。',
    image: 'coffee',
    tags: ['热销', '低卡'],
    rating: 4.8,
    sales: 3260,
    stock: 99,
    specs: [
      { size: '中杯 350ml', price: 18 },
      { size: '大杯 500ml', price: 22 },
      { size: '超大杯 700ml', price: 26 },
    ],
    ingredients: ['阿拉比卡咖啡豆', '纯净水'],
  },
  {
    id: 2,
    name: '拿铁咖啡',
    category: 'coffee',
    categoryName: '咖啡',
    price: 22,
    originalPrice: 26,
    description: '浓郁意式浓缩与丝滑鲜奶的完美融合，入口绵密，奶香与咖啡香层次分明。',
    image: 'coffee',
    tags: ['招牌', '奶香'],
    rating: 4.9,
    sales: 5120,
    stock: 88,
    specs: [
      { size: '中杯 350ml', price: 22 },
      { size: '大杯 500ml', price: 26 },
      { size: '超大杯 700ml', price: 30 },
    ],
    ingredients: ['意式浓缩', '鲜牛奶', '奶泡'],
  },
  {
    id: 3,
    name: '冰萃冷泡咖啡',
    category: 'coffee',
    categoryName: '咖啡',
    price: 24,
    description: '12 小时低温慢萃，酸度柔和，果香突出，夏日解暑首选。',
    image: 'snowflake',
    tags: ['冰饮', '清爽'],
    rating: 4.7,
    sales: 1890,
    stock: 56,
    specs: [
      { size: '中杯 350ml', price: 24 },
      { size: '大杯 500ml', price: 28 },
    ],
    ingredients: ['冷萃咖啡液', '冰块'],
  },
  {
    id: 4,
    name: '可口可乐',
    category: 'soda',
    categoryName: '汽水',
    price: 6,
    description: '经典可乐口味，气泡十足，冰爽畅快，搭配餐食更美味。',
    image: 'cup-soda',
    tags: ['经典', '冰爽'],
    rating: 4.6,
    sales: 8900,
    stock: 200,
    specs: [
      { size: '罐装 330ml', price: 6 },
      { size: '瓶装 500ml', price: 8 },
      { size: '瓶装 1.25L', price: 12 },
    ],
    ingredients: ['碳酸水', '白砂糖', '焦糖色', '天然香料'],
  },
  {
    id: 5,
    name: '百事可乐',
    category: 'soda',
    categoryName: '汽水',
    price: 6,
    description: '年轻活力的可乐选择，口感甜润，气泡细腻持久。',
    image: 'cup-soda',
    tags: ['年轻', '甜润'],
    rating: 4.5,
    sales: 7200,
    stock: 180,
    specs: [
      { size: '罐装 330ml', price: 6 },
      { size: '瓶装 500ml', price: 8 },
    ],
    ingredients: ['碳酸水', '白砂糖', '焦糖色'],
  },
  {
    id: 6,
    name: '雪碧柠檬味汽水',
    category: 'soda',
    categoryName: '汽水',
    price: 6,
    description: '清新柠檬味，透明无色，口感清甜，解腻首选。',
    image: 'citrus',
    tags: ['清新', '柠檬'],
    rating: 4.6,
    sales: 6500,
    stock: 150,
    specs: [
      { size: '罐装 330ml', price: 6 },
      { size: '瓶装 500ml', price: 8 },
    ],
    ingredients: ['碳酸水', '白砂糖', '柠檬酸', '天然柠檬香料'],
  },
  {
    id: 7,
    name: '茉莉绿茶',
    category: 'tea',
    categoryName: '茶饮',
    price: 12,
    description: '选用优质茉莉花茶，花香清雅，茶味回甘，零添加更安心。',
    image: 'leaf',
    tags: ['清香', '无糖'],
    rating: 4.7,
    sales: 2800,
    stock: 120,
    specs: [
      { size: '中杯 500ml', price: 12 },
      { size: '大杯 700ml', price: 15 },
    ],
    ingredients: ['茉莉花茶', '纯净水'],
  },
  {
    id: 8,
    name: '芝士奶盖红茶',
    category: 'tea',
    categoryName: '茶饮',
    price: 20,
    originalPrice: 24,
    description: '斯里兰卡红茶底搭配绵密芝士奶盖，先抿奶盖再品茶，层次丰富。',
    image: 'milk',
    tags: ['招牌', '奶盖'],
    rating: 4.9,
    sales: 4560,
    stock: 75,
    specs: [
      { size: '中杯 500ml', price: 20 },
      { size: '大杯 700ml', price: 24 },
    ],
    ingredients: ['红茶', '芝士奶盖', '淡奶油', '海盐'],
  },
  {
    id: 9,
    name: '鲜榨橙汁',
    category: 'juice',
    categoryName: '果汁',
    price: 16,
    description: '当日新鲜脐橙现榨，不加水不加糖，满满维 C，健康美味。',
    image: 'citrus',
    tags: ['鲜榨', '维C'],
    rating: 4.8,
    sales: 2100,
    stock: 60,
    specs: [
      { size: '中杯 350ml', price: 16 },
      { size: '大杯 500ml', price: 20 },
    ],
    ingredients: ['新鲜脐橙'],
  },
  {
    id: 10,
    name: '西瓜汁',
    category: 'juice',
    categoryName: '果汁',
    price: 14,
    description: '当季麒麟西瓜现榨，清甜多汁，冰镇后口感更佳。',
    image: 'droplets',
    tags: ['季节限定', '清甜'],
    rating: 4.7,
    sales: 1680,
    stock: 45,
    specs: [
      { size: '中杯 350ml', price: 14 },
      { size: '大杯 500ml', price: 18 },
    ],
    ingredients: ['新鲜西瓜'],
  },
  {
    id: 11,
    name: '珍珠奶茶',
    category: 'milk',
    categoryName: '奶茶',
    price: 15,
    originalPrice: 18,
    description: '经典台式风味，Q 弹黑糖珍珠搭配香浓奶茶，百喝不腻。',
    image: 'milk',
    tags: ['经典', '珍珠'],
    rating: 4.8,
    sales: 6800,
    stock: 100,
    specs: [
      { size: '中杯 500ml', price: 15 },
      { size: '大杯 700ml', price: 18 },
    ],
    ingredients: ['红茶', '鲜奶', '黑糖珍珠'],
  },
  {
    id: 12,
    name: '芋泥波波奶茶',
    category: 'milk',
    categoryName: '奶茶',
    price: 22,
    description: '手作芋泥绵密香甜，搭配软糯小芋圆和醇香奶茶，口感丰富。',
    image: 'cookie',
    tags: ['网红', '芋泥'],
    rating: 4.9,
    sales: 3900,
    stock: 65,
    specs: [
      { size: '中杯 500ml', price: 22 },
      { size: '大杯 700ml', price: 26 },
    ],
    ingredients: ['芋泥', '小芋圆', '鲜奶', '红茶'],
  },
]
