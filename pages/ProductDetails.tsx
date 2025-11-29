
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ChevronLeft, Edit } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProduct } = useData();
  const { user } = useAuth();
  const product = getProduct(id || '');
  const [activeImageIndex, setActiveImageIndex] = useState(product?.coverImageIndex || 0);

  if (!product) {
    return <div className="p-10 text-center">Produto não encontrado.</div>;
  }
  
  const displayCategory = product.category === 'Macacões' ? 'Camisetas' : product.category;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary transition">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para o catálogo
        </Link>
        {user?.role === UserRole.ADMIN && (
            <Link 
              to={`/admin/edit/${product.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
                <Edit className="h-4 w-4 mr-2" />
                Editar Produto
            </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-portrait bg-gray-100 rounded-lg overflow-hidden shadow-sm">
            {product.images[activeImageIndex] && (
               <img 
                 src={product.images[activeImageIndex]} 
                 alt={product.name} 
                 className="w-full h-full object-cover"
               />
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`flex-shrink-0 w-20 aspect-portrait rounded overflow-hidden border-2 ${activeImageIndex === idx ? 'border-secondary' : 'border-transparent'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
           <div className="mb-2">
             <span className="text-sm font-medium text-secondary uppercase tracking-wider">{displayCategory}</span>
           </div>
           <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">{product.name}</h1>
           
           <div className="prose text-gray-600 mb-6">
             <p>{product.description}</p>
             {product.fabric && (
               <p className="mt-2 text-sm"><span className="font-semibold">Tecido:</span> {product.fabric}</p>
             )}
           </div>

           <div className="border-t border-gray-100 pt-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Referências Vinculadas</h3>
              
              {product.variants.map(variant => {
                 const price = user 
                    ? (user.role === UserRole.SACOLEIRA ? variant.priceSacoleira : variant.priceRepresentative)
                    : null;

                 return (
                   <div key={variant.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            {/* Specific Variant Name (comes from Reference Base name now) */}
                            {variant.name && (
                                <div className="text-sm font-semibold text-secondary uppercase mb-1">{variant.name}</div>
                            )}
                            <div className="font-bold text-gray-900 text-lg">Ref: {variant.reference}</div>
                            <div className="text-sm text-gray-500 mt-1">Tamanho: <span className="font-medium text-gray-800">{variant.sizeRange}</span></div>
                         </div>
                         <div className="text-right">
                           {price ? (
                             <div className="text-xl font-bold text-primary">R$ {price.toFixed(2)}</div>
                           ) : (
                             <div className="text-sm text-gray-400 italic">Login para ver preço</div>
                           )}
                           {user?.role === UserRole.ADMIN && (
                             <div className="text-xs text-gray-400 mt-1">
                               Rep: R${variant.priceRepresentative} | Sac: R${variant.priceSacoleira}
                             </div>
                           )}
                         </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase block mb-2">Cores Disponíveis</span>
                        <div className="flex flex-wrap gap-3">
                          {variant.colors.map((color, idx) => (
                             <div key={idx} className="flex items-center group">
                                <div 
                                  className="w-8 h-8 rounded-full border border-gray-300 shadow-sm mr-2" 
                                  style={{ backgroundColor: color.hex }}
                                ></div>
                                <span className="text-sm text-gray-700">{color.name}</span>
                             </div>
                          ))}
                        </div>
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
