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

export interface Category {
  key: string
  name: string
}

export interface ProductListResponse {
  success: boolean
  data: {
    list: Product[]
    categories: Category[]
    total: number
  }
}

export interface ProductDetailResponse {
  success: boolean
  data: Product
}

export interface ProductMutationResponse {
  success: boolean
  message?: string
  data?: Product
}

export interface ProductDeleteResponse {
  success: boolean
  message?: string
  data?: { id: number }
}

/** 后台表单数据 */
export interface ProductFormData {
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
  ingredients: string[]
}
