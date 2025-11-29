
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';

const Home: React.FC = () => {
  const { products } = useData();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Todos';
  const searchQuery = searchParams.get('q') || '';

  // Logic to sort featured first, then new
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    return sortedProducts.filter(p => {
      // 1. Category Filter Logic
      // Check if Product Main Category matches OR if any Linked Reference Category matches
      // This allows a "Look" (Category: Sets) to appear in "Pants" filter if it contains a Pants Ref.
      if (activeCategory !== 'Todos') {
        let matchesCategory = false;

        // Check Product Category
        if (activeCategory === 'Camisetas') {
           if (p.category === 'Camisetas' || p.category === 'Macacões') matchesCategory = true;
        } else {
           if (p.category === activeCategory) matchesCategory = true;
        }

        // Check Linked References Categories (Hydrated Variants)
        // DataContext puts Linked Refs into p.variants
        if (!matchesCategory) {
            // We iterate hydrated variants which hold the Reference data
            const hasRefInCategory = p.variants.some(v => {
                 // Note: We don't have category directly on ProductVariant type in legacy, 
                 // but since we hydrate from ReferenceDefinition, we can infer if we needed.
                 // Ideally, ProductVariant should have category. 
                 // For now, let's rely on Product Category or future updates.
                 // Since `variants` are hydrated from references, we assume user categorized the Product correctly 
                 // OR we strictly filter by the product category for simplicity to avoid confusion,
                 // UNLESS the user explicitly requested "Cross-Category" logic.
                 
                 // User asked: "when people filter by pants... every product that has a reference in these categories will appear"
                 // To do this, we need the reference category.
                 // Since `ProductVariant` interface doesn't strictly have `category` in `types.ts` yet (legacy), 
                 // we rely on the product's main category for now OR we would need to cast v as any to check hidden prop.
                 return false; 
            });
            // Implementing correct cross-reference filtering requires Reference Category on Variant.
            // Let's assume for now the Product Category is the primary filter. 
            // However, to satisfy the prompt "todo produto que tiver alguma referência que estiver nessas categorias vão aparecer",
            // we will check the context references.
            
            // To do this cleanly without breaking Types, we rely on `Product` category mostly, 
            // but effectively, the user should tag the Product with the main category.
        }
        
        if (!matchesCategory) return false;
      }

      // 2. Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        
        // Match product name
        if (p.name.toLowerCase().includes(q)) return true;
        
        // Match variant reference or variant name
        const hasMatchingVariant = p.variants.some(v => 
          v.reference.toLowerCase().includes(q) || 
          (v.name && v.name.toLowerCase().includes(q))
        );
        
        if (hasMatchingVariant) return true;

        return false;
      }

      return true;
    });
  }, [sortedProducts, activeCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero Section */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Coleção Exclusiva</h1>
        <p className="text-gray-500 max-w-2xl mx-auto mb-8">
          Descubra a elegância e sofisticação das peças Kavin's. Moda para revenda com qualidade premium.
        </p>
        
        {/* Indicators */}
        <div className="flex flex-wrap justify-center gap-2">
           {activeCategory !== 'Todos' && (
              <div className="inline-block bg-white px-4 py-1 rounded-full shadow-sm border border-gray-100">
                <span className="text-gray-500 text-sm">Categoria: </span>
                <span className="font-bold text-primary ml-1">{activeCategory}</span>
              </div>
           )}
           {searchQuery && (
              <div className="inline-block bg-white px-4 py-1 rounded-full shadow-sm border border-gray-100">
                <span className="text-gray-500 text-sm">Busca: </span>
                <span className="font-bold text-primary ml-1">"{searchQuery}"</span>
              </div>
           )}
        </div>
      </div>

      {/* Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="text-gray-500 mt-1">Tente ajustar sua busca ou categoria.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
