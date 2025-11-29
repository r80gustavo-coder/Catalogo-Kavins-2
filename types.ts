
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

// Interface para a Referência Base (Master Data)
export interface ReferenceDefinition {
  id: string;
  code: string; // O código da referência (ex: 001)
  name: string; // Nome interno/genérico (ex: Vestido Longo)
  category: string;
  sizeRange: SizeRange;
  priceRepresentative: number;
  priceSacoleira: number;
  colors: Color[];
  createdAt: number;
}

// Interface antiga mantida para compatibilidade visual, 
// mas agora será populada dinamicamente via ReferenceDefinition
export interface ProductVariant {
  id: string;
  name?: string; 
  reference: string;
  sizeRange: SizeRange;
  priceRepresentative: number;
  priceSacoleira: number;
  colors: Color[];
}

export interface Product {
  id: string;
  name: string; // Título do anúncio/foto
  description: string;
  fabric: string;
  category: string; // Categoria principal do anúncio
  images: string[]; 
  coverImageIndex: number;
  isFeatured: boolean;
  
  // Novo campo: IDs das referências vinculadas
  referenceIds: string[];
  
  // Campo legado/calculado: variants populadas para o frontend usar
  variants: ProductVariant[];
  
  createdAt: number;
}

export interface User {
  username: string;
  role: UserRole;
}
