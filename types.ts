export enum UserRole {
  ADMIN = 'ADMIN',
  REPRESENTATIVE = 'REPRESENTATIVE',
  SACOLEIRA = 'SACOLEIRA',
  GUEST = 'GUEST',
}

export enum SizeRange {
  P_GG = 'P ao GG',
  G1_G3 = 'G1 ao G3',
}

export interface Color {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  name?: string; // Specific name for this variant (e.g. "Estampa Floral")
  reference: string;
  sizeRange: SizeRange;
  priceRepresentative: number;
  priceSacoleira: number;
  colors: Color[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  fabric: string;
  category: string;
  images: string[]; // Base64 strings
  coverImageIndex: number;
  isFeatured: boolean;
  variants: ProductVariant[];
  createdAt: number;
}

export interface User {
  username: string;
  role: UserRole;
}