export type User = {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    zipcode: string;
    city: string;
    role: 'user' | 'admin';
    createdAt: string;
    updatedAt?: string;
  }

export type Tree = {
    id: number;
    name: string;
    scientific_name: string;
    image: string;
    category: string;
    categorySlug: string;
    description: string;
    co2: number;
    o2: number;
    price: number;
    createdAt: string;
    updatedAt?: string;
  }

export type Forest = {
    id: number;
    name: string;
    association: string;
    image: string;
    description: string;
    country: string;
    countrySlug: string;
    location_x: number;
    location_y: number;
    createdAt: string;
    updatedAt?: string;
}

export type Order = {
    id: number;
    user_id: number;
    total_price: number;
    status: number;
    createdAt: string;
    updatedAt?: string;
}

export type OrderItem = {
  id: number;
  order_id: number;
  tree_id: number;
  forest_id: number;
  name: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt?: string;
}
