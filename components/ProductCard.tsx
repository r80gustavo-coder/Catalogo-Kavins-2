import React from 'react';
import { Product, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuth();

  // Determine pricing display based on role
  const getPriceRange = () => {
    if (!user) return null;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let hasPrice = false;

    product.variants.forEach(v => {
      const price = user.role === UserRole.SACOLEIRA ? v.priceSacoleira : v.priceRepresentative;
      if (price) {
        hasPrice = true;
        if (price < minPrice) minPrice = price;
        if (price > maxPrice) maxPrice = price;
      }
    });

    if (!hasPrice) return null;
    if (minPrice === maxPrice) return `R$ ${minPrice.toFixed(2)}`;
    return `R$ ${minPrice.toFixed(2)} - R$ ${maxPrice.toFixed(2)}`;
  };

  const coverImage = product.images[product.coverImageIndex] || product.images[0];
  const priceDisplay = getPriceRange();

  // Collect all unique size ranges available
  const sizesAvailable = Array.from(new Set(product.variants.map(v => v.sizeRange)));
  
  // Collect all unique references
  const references = Array.from(new Set(product.variants.map(v => v.reference)));

  return (
    <Link to={`/product/${product.id}`} className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-portrait w-full relative bg-gray-200 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">Sem Imagem</div>
        )}
        
        {product.isFeatured && (
          <div className="absolute top-2 left-2 bg-secondary text-white text-xs font-bold px-2 py-1 uppercase tracking-wider">
            Destaque
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-1 text-xs text-gray-500 uppercase tracking-wide">
            {product.category}
        </div>
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-secondary truncate">
          {product.name}
        </h3>
        
        <div className="mt-2 flex flex-wrap gap-1">
             {sizesAvailable.map(size => (
                 <span key={size} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                     {size}
                 </span>
             ))}
        </div>

        <div className="mt-1 text-xs text-gray-400 truncate">
             Ref: {references.join(' / ')}
        </div>

        <div className="mt-3 flex items-center justify-between">
           {user ? (
             <span className="text-lg font-bold text-gray-900">
                {priceDisplay || "Consulte"}
             </span>
           ) : (
             <span className="text-sm text-secondary font-medium hover:underline">
               Faça login para ver preços
             </span>
           )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;