
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserRole, Product, SizeRange, Color, ReferenceDefinition } from '../types';
import { CATEGORIES, SIZE_OPTIONS } from '../constants';
import { Trash2, Plus, X, Upload, Check, Loader2, Edit, RefreshCw, Save, Layers, ShoppingBag, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    addProduct, updateProduct, getProduct, 
    references, addReference, updateReference, deleteReference,
    isLoading: isDataLoading 
  } = useData();
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Tabs: 'products' (Vitrine) or 'references' (Master Data)
  const [activeTab, setActiveTab] = useState<'products' | 'references'>('products');

  useEffect(() => {
    if (id) {
        // If editing a product ID, force product tab
        setActiveTab('products');
    }
  }, [id]);

  if (!user || user.role !== UserRole.ADMIN) {
    return <div className="p-10 text-center">Acesso Negado</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-primary">Painel Administrativo</h1>
        
        {/* Tab Switcher */}
        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 flex">
            <button
                onClick={() => { setActiveTab('products'); navigate('/admin'); }}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
            >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Vitrine (Produtos)
            </button>
            <button
                onClick={() => { setActiveTab('references'); navigate('/admin'); }}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'references' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
            >
                <Layers className="w-4 h-4 mr-2" />
                Referências Base
            </button>
        </div>
      </div>

      {activeTab === 'products' ? (
          <ProductForm productId={id} />
      ) : (
          <ReferenceManager references={references} onAdd={addReference} onUpdate={updateReference} onDelete={deleteReference} />
      )}
    </div>
  );
};

// --- SUB-COMPONENTE: Gerenciador de Referências (Master Data) ---
const ReferenceManager: React.FC<{
    references: ReferenceDefinition[];
    onAdd: (r: ReferenceDefinition) => Promise<void>;
    onUpdate: (r: ReferenceDefinition) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}> = ({ references, onAdd, onUpdate, onDelete }) => {
    
    // Form State for Reference
    const [editingId, setEditingId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [sizeRange, setSizeRange] = useState<SizeRange>(SizeRange.P_GG);
    const [priceRep, setPriceRep] = useState('');
    const [priceSac, setPriceSac] = useState('');
    const [colors, setColors] = useState<Color[]>([]);
    
    // Color Picker State
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [newColorName, setNewColorName] = useState('');
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const resetForm = () => {
        setEditingId(null);
        setCode('');
        setName('');
        setCategory(CATEGORIES[0]);
        setSizeRange(SizeRange.P_GG);
        setPriceRep('');
        setPriceSac('');
        setColors([]);
        setNewColorName('');
        setNewColorHex('#000000');
        setEditingColorIndex(null);
    };

    const startEdit = (ref: ReferenceDefinition) => {
        setEditingId(ref.id);
        setCode(ref.code);
        setName(ref.name);
        setCategory(ref.category);
        setSizeRange(ref.sizeRange);
        setPriceRep(ref.priceRepresentative.toString());
        setPriceSac(ref.priceSacoleira.toString());
        setColors([...ref.colors]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !priceRep || !priceSac) return alert("Preencha os campos obrigatórios");

        const refData: ReferenceDefinition = {
            id: editingId || crypto.randomUUID(),
            code,
            name,
            category,
            sizeRange,
            priceRepresentative: parseFloat(priceRep),
            priceSacoleira: parseFloat(priceSac),
            colors,
            createdAt: Date.now()
        };

        if (editingId) {
            await onUpdate(refData);
        } else {
            await onAdd(refData);
        }
        resetForm();
    };

    // Color logic (same as before)
    const handleColorAction = () => {
        if (!newColorName) return;
        if (editingColorIndex !== null) {
            const updated = [...colors];
            updated[editingColorIndex] = { name: newColorName, hex: newColorHex };
            setColors(updated);
            setEditingColorIndex(null);
        } else {
            setColors([...colors, { name: newColorName, hex: newColorHex }]);
        }
        setNewColorName('');
        setNewColorHex('#000000');
    };

    const filteredRefs = references.filter(r => 
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit sticky top-24">
                <h2 className="text-xl font-bold mb-4 text-secondary">{editingId ? 'Editar Referência' : 'Nova Referência'}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Código da Referência *</label>
                        <input type="text" required value={code} onChange={e => setCode(e.target.value)} className="w-full border p-2 rounded" placeholder="Ex: 001" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Nome Interno (Opcional)</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" placeholder="Ex: Vestido Floral" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Categoria Padrão</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 rounded">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Grade de Tamanho</label>
                        <select value={sizeRange} onChange={e => setSizeRange(e.target.value as SizeRange)} className="w-full border p-2 rounded">
                            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Preço Rep.</label>
                            <input type="number" required step="0.01" value={priceRep} onChange={e => setPriceRep(e.target.value)} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Preço Sac.</label>
                            <input type="number" required step="0.01" value={priceSac} onChange={e => setPriceSac(e.target.value)} className="w-full border p-2 rounded" />
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="border-t pt-2 mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Cores</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {colors.map((c, i) => (
                                <div key={i} onClick={() => { setNewColorName(c.name); setNewColorHex(c.hex); setEditingColorIndex(i); }} className="cursor-pointer flex items-center bg-gray-50 border rounded-full px-2 py-1 text-xs">
                                    <span className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: c.hex}}></span>
                                    {c.name}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-1 items-end">
                            <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="h-8 w-8 p-0 border rounded cursor-pointer" />
                            <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Nome Cor" className="flex-1 border p-1.5 rounded text-sm" />
                            <button type="button" onClick={handleColorAction} className="bg-gray-800 text-white p-1.5 rounded hover:bg-black">
                                {editingColorIndex !== null ? <RefreshCw size={16}/> : <Plus size={16}/>}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        {editingId && <button type="button" onClick={resetForm} className="flex-1 border py-2 rounded text-gray-600">Cancelar</button>}
                        <button type="submit" className="flex-1 bg-secondary text-white py-2 rounded font-bold hover:bg-yellow-700">
                            {editingId ? 'Atualizar Ref' : 'Criar Ref'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Right: List */}
            <div className="lg:col-span-2">
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Buscar referência por código ou nome..." 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preços</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRefs.map(ref => (
                                <tr key={ref.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{ref.code}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{ref.name}</div>
                                        <div className="text-xs text-gray-500">{ref.category} | {ref.sizeRange}</div>
                                        <div className="flex gap-1 mt-1">
                                            {ref.colors.slice(0, 5).map((c, i) => (
                                                <div key={i} className="w-3 h-3 rounded-full border border-gray-200" style={{backgroundColor: c.hex}} title={c.name}></div>
                                            ))}
                                            {ref.colors.length > 5 && <span className="text-xs text-gray-400">+{ref.colors.length - 5}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>Rep: R$ {ref.priceRepresentative}</div>
                                        <div>Sac: R$ {ref.priceSacoleira}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => startEdit(ref)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit size={16} /></button>
                                        <button onClick={() => { if(confirm('Tem certeza? Isso afetará produtos vinculados.')) onDelete(ref.id) }} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTE: Formulário de Produto (Vitrine) ---
const ProductForm: React.FC<{ productId?: string }> = ({ productId }) => {
    const { addProduct, updateProduct, getProduct, references } = useData();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fabric, setFabric] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [isFeatured, setIsFeatured] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [coverIndex, setCoverIndex] = useState(0);
    const [selectedRefIds, setSelectedRefIds] = useState<string[]>([]);
    
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [refSearch, setRefSearch] = useState('');

    useEffect(() => {
        if (productId) {
            const p = getProduct(productId);
            if (p) {
                setName(p.name);
                setDescription(p.description);
                setFabric(p.fabric);
                setCategory(p.category === 'Macacões' ? 'Camisetas' : p.category);
                setIsFeatured(p.isFeatured);
                setImages(p.images);
                setCoverIndex(p.coverImageIndex);
                // Load linked refs
                setSelectedRefIds(p.referenceIds || []);
            }
        }
    }, [productId, getProduct]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setIsUploading(true);
        const files = Array.from(e.target.files) as File[];
        const uploadedUrls: string[] = [];
        
        for (const file of files) {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
            const { error } = await supabase.storage.from('catalog-images').upload(fileName, file);
            if (!error) {
                const { data } = supabase.storage.from('catalog-images').getPublicUrl(fileName);
                uploadedUrls.push(data.publicUrl);
            }
        }
        setImages(prev => [...prev, ...uploadedUrls]);
        setIsUploading(false);
    };

    const toggleRef = (refId: string) => {
        if (selectedRefIds.includes(refId)) {
            setSelectedRefIds(prev => prev.filter(id => id !== refId));
        } else {
            setSelectedRefIds(prev => [...prev, refId]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) return alert("Adicione imagens");
        if (selectedRefIds.length === 0) return alert("Selecione pelo menos uma Referência Base");

        setIsSaving(true);
        const productData: Product = {
            id: productId || crypto.randomUUID(),
            name,
            description,
            fabric,
            category,
            isFeatured,
            images,
            coverImageIndex: coverIndex,
            referenceIds: selectedRefIds,
            variants: [], // Não usado para novos produtos
            createdAt: productId ? (getProduct(productId)?.createdAt || Date.now()) : Date.now()
        };

        if (productId) {
            await updateProduct(productData);
        } else {
            await addProduct(productData);
        }
        navigate('/');
        setIsSaving(false);
    };

    const availableRefs = references.filter(r => 
        r.code.toLowerCase().includes(refSearch.toLowerCase()) || 
        r.name.toLowerCase().includes(refSearch.toLowerCase())
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800">{productId ? 'Editar Vitrine' : 'Nova Vitrine'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Título do Anúncio</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" placeholder="Ex: Look Completo - Calça e Blusa" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria Principal</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 rounded">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tecido</label>
                    <input type="text" value={fabric} onChange={e => setFabric(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded"></textarea>
                </div>
                <div>
                    <input type="checkbox" id="feat" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="mr-2" />
                    <label htmlFor="feat" className="text-sm text-gray-900">Produto em Destaque</label>
                </div>
            </div>

            {/* Images */}
            <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Fotos da Vitrine</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {images.map((img, i) => (
                        <div key={i} className={`relative aspect-portrait border-2 ${coverIndex === i ? 'border-secondary' : 'border-transparent'}`}>
                            <img src={img} className="w-full h-full object-cover" alt="" />
                            <button type="button" onClick={() => setImages(prev => prev.filter((_, x) => x !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                            <button type="button" onClick={() => setCoverIndex(i)} className="absolute bottom-1 right-1 bg-white text-xs px-1 rounded">Capa</button>
                        </div>
                    ))}
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-portrait border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                        {isUploading ? <Loader2 className="animate-spin"/> : <Upload className="text-gray-400"/>}
                        <span className="text-xs text-gray-500 mt-1">Add Foto</span>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple className="hidden" accept="image/*" />
            </div>

            {/* Reference Linking */}
            <div className="border-t pt-4 bg-gray-50 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800">Vincular Referências Base</h3>
                    <input type="text" placeholder="Filtrar refs..." value={refSearch} onChange={e => setRefSearch(e.target.value)} className="text-sm border p-1 rounded w-48" />
                </div>
                <p className="text-xs text-gray-500 mb-4">Selecione quais referências (preços/cores) compõem este produto visual.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {availableRefs.map(ref => {
                        const isSelected = selectedRefIds.includes(ref.id);
                        return (
                            <div 
                                key={ref.id} 
                                onClick={() => toggleRef(ref.id)}
                                className={`cursor-pointer border rounded p-3 flex items-start space-x-2 transition-all ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white hover:border-gray-400'}`}
                            >
                                <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                    {isSelected && <Check className="text-white w-3 h-3" />}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-900">Ref: {ref.code}</div>
                                    <div className="text-xs text-gray-600">{ref.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{ref.category} | {ref.sizeRange}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {availableRefs.length === 0 && <p className="text-center text-gray-500 py-4 italic">Nenhuma referência encontrada. Cadastre na aba "Referências Base".</p>}
            </div>

            <div className="flex justify-end pt-4">
                <button disabled={isSaving} className="bg-primary text-white px-8 py-3 rounded font-bold hover:bg-black w-full md:w-auto">
                    {isSaving ? 'Salvando...' : productId ? 'Atualizar Vitrine' : 'Publicar Vitrine'}
                </button>
            </div>
        </form>
    );
};

export default AdminDashboard;
