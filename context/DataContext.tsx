import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { supabase } from '../lib/supabase';

interface DataContextType {
  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
    } else if (data) {
      // Mapear snake_case do banco para camelCase do tipo Product se necessário
      // Como criamos a tabela com nomes compatíveis, o mapeamento principal é o variants e created_at
      const mappedProducts: Product[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        fabric: item.fabric,
        category: item.category,
        isFeatured: item.is_featured,
        images: item.images || [],
        coverImageIndex: item.cover_image_index,
        variants: item.variants || [],
        createdAt: Number(item.created_at)
      }));
      setProducts(mappedProducts);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Product) => {
    const dbProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      fabric: product.fabric,
      category: product.category,
      is_featured: product.isFeatured,
      cover_image_index: product.coverImageIndex,
      images: product.images,
      variants: product.variants,
      created_at: product.createdAt
    };

    const { error } = await supabase.from('products').insert(dbProduct);
    
    if (error) {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao salvar no banco de dados.');
    } else {
      setProducts(prev => [product, ...prev]);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    const dbProduct = {
      name: updatedProduct.name,
      description: updatedProduct.description,
      fabric: updatedProduct.fabric,
      category: updatedProduct.category,
      is_featured: updatedProduct.isFeatured,
      cover_image_index: updatedProduct.coverImageIndex,
      images: updatedProduct.images,
      variants: updatedProduct.variants,
    };

    const { error } = await supabase
      .from('products')
      .update(dbProduct)
      .eq('id', updatedProduct.id);

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar no banco de dados.');
    } else {
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao deletar.');
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const getProduct = (id: string) => {
    return products.find(p => p.id === id);
  };

  return (
    <DataContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, getProduct, isLoading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};