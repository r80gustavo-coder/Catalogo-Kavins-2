
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, ReferenceDefinition, ProductVariant } from '../types';
import { supabase } from '../lib/supabase';

interface DataContextType {
  products: Product[];
  references: ReferenceDefinition[];
  
  // Product Actions
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  
  // Reference Actions
  addReference: (ref: ReferenceDefinition) => Promise<void>;
  updateReference: (ref: ReferenceDefinition) => Promise<void>;
  deleteReference: (id: string) => Promise<void>;

  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [references, setReferences] = useState<ReferenceDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    
    // 1. Fetch References (Master Data)
    const { data: refsData, error: refsError } = await supabase
      .from('reference_definitions')
      .select('*')
      .order('code', { ascending: true });

    let loadedReferences: ReferenceDefinition[] = [];

    if (refsError) {
      console.error('Erro ao buscar referências:', refsError);
    } else if (refsData) {
      loadedReferences = refsData.map((item: any) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.category,
        sizeRange: item.size_range,
        priceRepresentative: Number(item.price_rep),
        priceSacoleira: Number(item.price_sac),
        colors: item.colors || [],
        createdAt: Number(item.created_at)
      }));
      setReferences(loadedReferences);
    }

    // 2. Fetch Products
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (prodError) {
      console.error('Erro ao buscar produtos:', prodError);
    } else if (prodData) {
      // Map and Hydrate Products
      const mappedProducts: Product[] = prodData.map((item: any) => {
        const referenceIds: string[] = item.reference_ids || [];
        
        // HYDRATION: Convert linked Reference IDs into usable Variant objects
        // This ensures if a Reference is updated, the Product reflects it immediately.
        const dynamicVariants: ProductVariant[] = [];
        
        // Find linked references in our loadedReferences array
        referenceIds.forEach(refId => {
          const refDef = loadedReferences.find(r => r.id === refId);
          if (refDef) {
            dynamicVariants.push({
              id: refDef.id,
              name: refDef.name, // "Vestido Floral"
              reference: refDef.code,
              sizeRange: refDef.sizeRange,
              priceRepresentative: refDef.priceRepresentative,
              priceSacoleira: refDef.priceSacoleira,
              colors: refDef.colors
            });
          }
        });

        // Fallback: If no references linked, check for legacy embedded variants
        // This keeps old data working until migrated
        const finalVariants = dynamicVariants.length > 0 
          ? dynamicVariants 
          : (item.variants || []);

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          fabric: item.fabric,
          category: item.category,
          isFeatured: item.is_featured,
          images: item.images || [],
          coverImageIndex: item.cover_image_index,
          referenceIds: referenceIds,
          variants: finalVariants, // This is now a computed/mixed field
          createdAt: Number(item.created_at)
        };
      });

      setProducts(mappedProducts);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Reference Actions ---

  const addReference = async (ref: ReferenceDefinition) => {
    const dbRef = {
      id: ref.id,
      code: ref.code,
      name: ref.name,
      category: ref.category,
      size_range: ref.sizeRange,
      price_rep: ref.priceRepresentative,
      price_sac: ref.priceSacoleira,
      colors: ref.colors,
      created_at: ref.createdAt
    };

    const { error } = await supabase.from('reference_definitions').insert(dbRef);
    if (error) {
      console.error(error);
      alert('Erro ao salvar referência.');
    } else {
      setReferences(prev => [...prev, ref]);
      // Refresh products to reflect new ref if linked immediately (rare but possible)
      fetchData(); 
    }
  };

  const updateReference = async (ref: ReferenceDefinition) => {
    const dbRef = {
      code: ref.code,
      name: ref.name,
      category: ref.category,
      size_range: ref.sizeRange,
      price_rep: ref.priceRepresentative,
      price_sac: ref.priceSacoleira,
      colors: ref.colors,
    };

    const { error } = await supabase.from('reference_definitions').update(dbRef).eq('id', ref.id);
    if (error) {
      console.error(error);
      alert('Erro ao atualizar referência.');
    } else {
      setReferences(prev => prev.map(r => r.id === ref.id ? ref : r));
      // CRITICAL: Re-fetch or Re-calc products to update prices/colors on the storefront
      fetchData(); 
    }
  };

  const deleteReference = async (id: string) => {
    const { error } = await supabase.from('reference_definitions').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert('Erro ao deletar referência.');
    } else {
      setReferences(prev => prev.filter(r => r.id !== id));
      fetchData();
    }
  };

  // --- Product Actions ---

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
      reference_ids: product.referenceIds, // Save the links
      variants: [], // We don't save legacy variants for new products anymore
      created_at: product.createdAt
    };

    const { error } = await supabase.from('products').insert(dbProduct);
    
    if (error) {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao salvar no banco de dados.');
    } else {
      // Optimistic update tricky here due to hydration, easier to fetch
      fetchData();
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
      reference_ids: updatedProduct.referenceIds, // Update links
      // Don't overwrite variants if it was legacy, but for new system strictly use refs
    };

    const { error } = await supabase
      .from('products')
      .update(dbProduct)
      .eq('id', updatedProduct.id);

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar no banco de dados.');
    } else {
      fetchData();
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
    <DataContext.Provider value={{ 
      products, 
      references,
      addProduct, 
      updateProduct, 
      deleteProduct, 
      getProduct, 
      addReference,
      updateReference,
      deleteReference,
      isLoading 
    }}>
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
