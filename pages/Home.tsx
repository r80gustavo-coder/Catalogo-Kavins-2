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
      // Category Filter with Legacy Support
      if (activeCategory !== 'Todos') {
        if (activeCategory === 'Camisetas') {
           // Show both new Camisetas and legacy Macacões
           if (p.category !== 'Camisetas' && p.category !== 'Macacões') {
             return false;
           }
        } else if (p.category !== activeCategory) {
          return false;
        }
      }

      // Search Filter
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