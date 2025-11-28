import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserRole, Product, ProductVariant, SizeRange, Color } from '../types';
import { CATEGORIES, SIZE_OPTIONS } from '../constants';
import { Trash2, Plus, X, Upload, Check, Loader2, Edit, RefreshCw, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addProduct, getProduct, updateProduct, isLoading: isDataLoading } = useData();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fabric, setFabric] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Variant Form State
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  
  // Variant Input States
  const [tempVariantName, setTempVariantName] = useState('');
  const [tempRef, setTempRef] = useState('');
  const [tempSize, setTempSize] = useState<SizeRange>(SizeRange.P_GG);
  const [tempPriceRep, setTempPriceRep] = useState('');
  const [tempPriceSac, setTempPriceSac] = useState('');
  const [tempColors, setTempColors] = useState<Color[]>([]);
  
  // Color Picker State
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newColorName, setNewColorName] = useState('');
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null); 

  const variantFormRef = useRef<HTMLDivElement>(null);

  // Load product if editing
  useEffect(() => {
    if (id && !isDataLoading) {
      const product = getProduct(id);
      if (product) {
        setName(product.name);
        setDescription(product.description);
        setFabric(product.fabric);
        
        // Auto-fix legacy category
        if (product.category === 'Macacões') {
            setCategory('Camisetas');
        } else {
            setCategory(product.category);
        }

        setIsFeatured(product.isFeatured);
        setImages(product.images);
        setCoverIndex(product.coverImageIndex);
        setVariants(product.variants);
      }
    }
  }, [id, getProduct, isDataLoading]);

  if (!user || user.role !== UserRole.ADMIN) {
    return <div className="p-10 text-center">Acesso Negado</div>;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const files: File[] = Array.from(e.target.files);
      const uploadedUrls: string[] = [];
      let errorCount = 0;
      
      try {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('catalog-images')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            errorCount++;
            continue;
          }

          const { data } = supabase.storage
            .from('catalog-images')
            .getPublicUrl(filePath);
            
          if (data.publicUrl) {
            uploadedUrls.push(data.publicUrl);
          }
        }

        if (errorCount > 0) {
          alert(`${errorCount} imagem(ns) falharam ao enviar. Verifique permissões no Supabase.`);
        }

        setImages(prev => [...prev, ...uploadedUrls]);
      } catch (error) {
        console.error("Upload process error:", error);
        alert("Erro crítico ao fazer upload das imagens.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (coverIndex >= index && coverIndex > 0) setCoverIndex(coverIndex - 1);
  };

  const handleAddOrUpdateColor = () => {
    if (!newColorName) return;

    if (editingColorIndex !== null) {
      // Update existing color
      setTempColors(prev => {
        const newColors = [...prev];
        newColors[editingColorIndex] = { name: newColorName, hex: newColorHex };
        return newColors;
      });
      setEditingColorIndex(null); 
    } else {
      // Add new color
      setTempColors(prev => [...prev, { name: newColorName, hex: newColorHex }]);
    }
    
    // Reset inputs
    setNewColorName('');
    setNewColorHex('#000000');
  };

  const editColor = (index: number) => {
    const colorToEdit = tempColors[index];
    setNewColorName(colorToEdit.name);
    setNewColorHex(colorToEdit.hex);
    setEditingColorIndex(index);
  };

  const cancelColorEdit = () => {
    setNewColorName('');
    setNewColorHex('#000000');
    setEditingColorIndex(null);
  };

  const removeTempColor = (idx: number) => {
    setTempColors(prev => prev.filter((_, i) => i !== idx));
    if (editingColorIndex === idx) {
      cancelColorEdit();
    } else if (editingColorIndex !== null && editingColorIndex > idx) {
      setEditingColorIndex(editingColorIndex - 1);
    }
  };

  const handleSaveVariant = () => {
    if (!tempRef || !tempPriceRep || !tempPriceSac || tempColors.length === 0) {
      alert("Preencha todos os campos da variante (Referência, Preços e pelo menos uma cor).");
      return;
    }

    const variantData: ProductVariant = {
      id: editingVariantId || Date.now().toString() + Math.random().toString(),
      name: tempVariantName,
      reference: tempRef,
      sizeRange: tempSize,
      priceRepresentative: parseFloat(tempPriceRep),
      priceSacoleira: parseFloat(tempPriceSac),
      colors: [...tempColors]
    };

    if (editingVariantId) {
      setVariants(prev => prev.map(v => v.id === editingVariantId ? variantData : v));
      setEditingVariantId(null);
    } else {
      setVariants(prev => [...prev, variantData]);
    }
    
    clearVariantForm();
  };

  const startEditingVariant = (variant: ProductVariant) => {
    setEditingVariantId(variant.id);
    setTempVariantName(variant.name || '');
    setTempRef(variant.reference);
    setTempSize(variant.sizeRange);
    setTempPriceRep(variant.priceRepresentative.toString());
    setTempPriceSac(variant.priceSacoleira.toString());
    setTempColors([...variant.colors]);
    
    cancelColorEdit();
    variantFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearVariantForm = () => {
    setEditingVariantId(null);
    setTempColors([]);
    setTempRef('');
    setTempVariantName('');
    setTempPriceRep('');
    setTempPriceSac('');
    setTempSize(SizeRange.P_GG);
    cancelColorEdit();
  };

  const removeVariant = (variantId: string) => {
    setVariants(prev => prev.filter(v => v.id !== variantId));
    if (editingVariantId === variantId) {
      clearVariantForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      alert("Adicione pelo menos uma imagem.");
      return;
    }
    if (variants.length === 0) {
      alert("Adicione pelo menos uma variante.");
      return;
    }

    setIsSaving(true);

    const productData: Product = {
      id: id || crypto.randomUUID(), 
      name,
      description,
      fabric,
      category,
      isFeatured,
      images,
      coverImageIndex: coverIndex,
      variants,
      createdAt: id ? (getProduct(id)?.createdAt || Date.now()) : Date.now()
    };

    try {
      if (id) {
        await updateProduct(productData);
      } else {
        await addProduct(productData);
      }
      navigate('/');
    } catch (error) {
      console.error("Error saving:", error);
      alert("Erro ao salvar produto.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">{id ? 'Editar Produto' : 'Cadastrar Produto'}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-md">
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nome Principal do Produto (Título)</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Vestido Longo Luxo" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Tecido</label>
             <input type="text" value={fabric} onChange={e => setFabric(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descrição Geral</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
          </div>

          <div className="flex items-center">
            <input
              id="featured"
              type="checkbox"
              checked={isFeatured}
              onChange={e => setIsFeatured(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-secondary border-gray-300 rounded"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
              Produto em Destaque (Aparece no topo)
            </label>
          </div>
        </div>

        {/* Image Upload */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Fotos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {images.map((img, idx) => (
              <div key={idx} className={`relative group aspect-portrait border-2 ${coverIndex === idx ? 'border-secondary' : 'border-transparent'}`}>
                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover rounded" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
                <button type="button" onClick={() => setCoverIndex(idx)} className="absolute bottom-1 right-1 bg-white text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                  {coverIndex === idx ? 'Capa' : 'Definir Capa'}
                </button>
              </div>
            ))}
            
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`aspect-portrait border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <Loader2 className="animate-spin text-primary mb-2" />
              ) : (
                <Upload className="text-gray-400 mb-2" />
              )}
              <span className="text-sm text-gray-500 text-center px-2">
                {isUploading ? 'Enviando...' : 'Adicionar Fotos'}
              </span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            multiple 
            accept="image/*" 
            className="hidden" 
            disabled={isUploading}
          />
        </div>

        {/* Variants Builder */}
        <div className="border-t pt-6 bg-gray-50 p-4 rounded-md" ref={variantFormRef}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Configuração de Tamanhos e Preços</h2>
            {editingVariantId && (
              <span className="text-sm text-secondary font-bold animate-pulse">
                Modo Edição Ativo
              </span>
            )}
          </div>
          
          {/* List existing variants */}
          {variants.length > 0 && (
            <div className="mb-6 space-y-2">
              {variants.map((v) => (
                <div key={v.id} className={`flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded border shadow-sm transition-all ${editingVariantId === v.id ? 'ring-2 ring-secondary border-secondary' : ''}`}>
                  <div className="mb-2 sm:mb-0">
                    {v.name && <div className="text-xs text-gray-500 font-medium uppercase mb-0.5">{v.name}</div>}
                    <div className="flex items-center flex-wrap">
                        <span className="font-bold text-primary mr-2">Ref: {v.reference}</span>
                        <span className="text-gray-300 mx-1">|</span>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded mx-2">{v.sizeRange}</span>
                        <div className="flex gap-1 ml-2 mt-1 sm:mt-0">
                            {v.colors.map((c, i) => (
                                <div key={i} className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: c.hex }} title={c.name}></div>
                            ))}
                        </div>
                    </div>
                  </div>
                  <div className="flex justify-between sm:justify-end items-center gap-4">
                     <div className="text-right text-sm">
                        <div className="text-green-700"><span className="text-xs text-gray-400">Rep:</span> R$ {v.priceRepresentative}</div>
                        <div className="text-blue-700"><span className="text-xs text-gray-400">Sac:</span> R$ {v.priceSacoleira}</div>
                     </div>
                     <div className="flex gap-2">
                        <button type="button" onClick={() => startEditingVariant(v)} className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded" title="Editar">
                           <Edit size={16} />
                        </button>
                        <button type="button" onClick={() => removeVariant(v.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded" title="Excluir">
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Variant Form */}
          <div className={`transition-all ${editingVariantId ? 'bg-yellow-50 p-4 rounded border border-yellow-200' : ''}`}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Nome da Opção (Ex: Estampa Floral / Conjunto Azul) - *Opcional</label>
                  <input type="text" value={tempVariantName} onChange={e => setTempVariantName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded p-2" placeholder="Nome específico para esta referência" />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700">Referência (Código)</label>
                 <input type="text" value={tempRef} onChange={e => setTempRef(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded p-2" placeholder="001" />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700">Tamanho</label>
                 <select value={tempSize} onChange={e => setTempSize(e.target.value as SizeRange)} className="mt-1 block w-full border border-gray-300 rounded p-2">
                   {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700">Preço Representante</label>
                 <input type="number" step="0.01" value={tempPriceRep} onChange={e => setTempPriceRep(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded p-2" />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700">Preço Sacoleira</label>
                 <input type="number" step="0.01" value={tempPriceSac} onChange={e => setTempPriceSac(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded p-2" />
               </div>
            </div>

            {/* Color Picker for Variant */}
            <div className="mt-4">
               <label className="block text-xs font-medium text-gray-700 mb-2">Cores Disponíveis para esta Referência (Clique para editar)</label>
               <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                  {tempColors.map((c, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center bg-white border rounded-full px-3 py-1 shadow-sm cursor-pointer transition-all hover:bg-gray-50 ${editingColorIndex === idx ? 'ring-2 ring-primary border-primary' : 'border-gray-200'}`}
                      onClick={() => editColor(idx)}
                      title="Clique para editar esta cor"
                    >
                      <span className="w-5 h-5 rounded-full mr-2 border border-gray-300" style={{ backgroundColor: c.hex }}></span>
                      <span className="text-xs text-gray-700">{c.name}</span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); removeTempColor(idx); }} 
                        className="ml-2 text-gray-400 hover:text-red-500"
                        title="Remover cor"
                      >
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                  {tempColors.length === 0 && (
                    <span className="text-xs text-gray-400 italic py-1">Nenhuma cor adicionada.</span>
                  )}
               </div>
               
               <div className={`flex gap-2 items-end border-t border-gray-200 pt-3 mt-2 ${editingColorIndex !== null ? 'bg-blue-50 p-2 rounded' : ''}`}>
                 <div>
                    <label className="text-xs text-gray-500">Cor (Hex)</label>
                    <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="block w-12 h-9 p-0 border border-gray-300 rounded cursor-pointer" />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs text-gray-500">Nome da Cor {editingColorIndex !== null ? '(Editando)' : ''}</label>
                    <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Ex: Azul Royal" className="block w-full border border-gray-300 rounded p-1.5 text-sm" />
                 </div>
                 
                 {editingColorIndex !== null && (
                   <button type="button" onClick={cancelColorEdit} className="bg-white text-gray-600 border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50">
                     Cancelar
                   </button>
                 )}

                 <button 
                   type="button" 
                   onClick={handleAddOrUpdateColor} 
                   className={`px-3 py-2 rounded text-sm flex items-center text-white ${editingColorIndex !== null ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                 >
                   {editingColorIndex !== null ? (
                     <><RefreshCw size={14} className="mr-1" /> Atualizar Cor</>
                   ) : (
                     <><Plus size={14} className="mr-1" /> Add Cor</>
                   )}
                 </button>
               </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {editingVariantId && (
                <button type="button" onClick={clearVariantForm} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
                  Cancelar Edição
                </button>
              )}
              <button 
                type="button" 
                onClick={handleSaveVariant} 
                className={`flex items-center px-4 py-2 text-white rounded shadow-sm transition ${editingVariantId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-secondary hover:bg-yellow-700'}`}
              >
                {editingVariantId ? (
                  <> <Save className="mr-2 h-4 w-4" /> Salvar Alterações da Variante </>
                ) : (
                  <> <Check className="mr-2 h-4 w-4" /> Adicionar Opção </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
           <button 
             type="submit" 
             disabled={isSaving || isUploading}
             className={`w-full md:w-auto px-8 py-3 bg-primary text-white text-lg font-bold rounded shadow transition flex items-center justify-center ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-900'}`}
           >
             {isSaving ? (
               <>
                <Loader2 className="animate-spin mr-2" /> Salvando...
               </>
             ) : (
               id ? 'Atualizar Produto Completo' : 'Salvar Produto Completo'
             )}
           </button>
        </div>

      </form>
    </div>
  );
};

export default AdminDashboard;