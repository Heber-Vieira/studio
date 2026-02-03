
import React, { useState } from 'react';
import { Service, Category } from '../types';
import { COLORS } from '../constants';
import {
  Plus, Search, Clock, Tag, X, Scissors, Droplet, Sparkles,
  Wand2, BookOpen, Trash2, Edit3, Check, FolderPlus, AlertTriangle,
  Brush, SprayCan, Palette, Gem, Crown, Gift, Zap, Heart, Smile,
  CheckCircle2
} from 'lucide-react';

interface ServicesProps {
  services: Service[];
  categories: Category[];
  onAdd: (service: Service) => void;
  onUpdate: (service: Service) => void;
  onDelete: (id: string) => void;
  onAddCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const IconMap: Record<string, any> = {
  Scissors,
  Droplet,
  Sparkles,
  Wand2,
  Tag,
  Brush,
  SprayCan,
  Palette,
  Gem,
  Crown,
  Gift,
  Zap,
  Heart,
  Smile
};

const BELLA_PALETTE = [
  '#FF69B4', // Pink
  '#40E0D0', // Turquoise
  '#C71585', // Purple
  '#FFD700', // Gold
  '#98FB98', // Mint
  '#FB7185', // Rose
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#10B981', // Emerald
];

const ServicesView: React.FC<ServicesProps> = ({ services, categories, onAdd, onUpdate, onDelete, onAddCategory, onDeleteCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  const [isDeleteCatModalOpen, setIsDeleteCatModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [newSvc, setNewSvc] = useState({
    name: '',
    category: '',
    price: 0,
    duration: '1h',
    description: '',
    color: BELLA_PALETTE[0]
  });

  React.useEffect(() => {
    if (categories.length > 0 && !newSvc.category) {
      setNewSvc(prev => ({ ...prev, category: categories[0].id }));
    }
  }, [categories]);
  const [newCat, setNewCat] = useState({ label: '', iconName: 'Tag' });

  const filteredServices = services.filter(s =>
    (selectedCategory === 'all' || s.category === selectedCategory) &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = () => {
    if (!newSvc.name || !newSvc.price) return;
    onAdd({
      id: '', // Supabase will generate this
      name: newSvc.name,
      category: newSvc.category,
      price: newSvc.price,
      duration: newSvc.duration,
      description: newSvc.description,
      color: newSvc.color
    });
    setIsModalOpen(false);
    setNewSvc({ name: '', category: categories[0]?.id || '', price: 0, duration: '1h', description: '', color: BELLA_PALETTE[0] });
  };

  const handleAddCategory = () => {
    if (!newCat.label) return;
    onAddCategory({
      id: newCat.label,
      label: newCat.label,
      iconName: newCat.iconName
    });
    setIsCatModalOpen(false);
    setNewCat({ label: '', iconName: 'Tag' });
  };

  const handleEdit = (svc: Service) => {
    setSelectedService(svc);
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedService || !selectedService.name || !selectedService.price) return;
    onUpdate(selectedService);
    setIsEditModalOpen(false);
    setSelectedService(null);
  };

  const handleDeleteClick = (svc: Service) => {
    setServiceToDelete(svc);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteService = () => {
    if (serviceToDelete) {
      onDelete(serviceToDelete.id);
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };

  const getServiceCountByCategory = (catId: string) => {
    return services.filter(s => s.category === catId).length;
  };

  const handleDeleteCategoryClick = (cat: Category) => {
    setCategoryToDelete(cat);
    setIsDeleteCatModalOpen(true);
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id);
      setIsDeleteCatModalOpen(false);
      setCategoryToDelete(null);
      if (selectedCategory === categoryToDelete.id) {
        setSelectedCategory('all');
      }
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Catálogo de Serviços 🌸</h2>
          <p className="text-gray-500 text-sm">Organize seu menu de beleza de forma vibrante.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-all"
          >
            <FolderPlus size={20} /> Categorias
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-[2] md:flex-none flex items-center justify-center gap-2 bg-[#FF69B4] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-pink-100 hover:scale-[1.05] transition-all"
          >
            <Plus size={20} /> Adicionar Serviço
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Categorias</h3>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${selectedCategory === 'all' ? 'bg-[#FF69B4] text-white shadow-lg shadow-pink-100 translate-x-2' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Sparkles size={18} /> Todos
          </button>
          {categories.map(cat => {
            const Icon = IconMap[cat.iconName] || Tag;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm group ${selectedCategory === cat.id ? 'bg-[#FF69B4] text-white shadow-lg shadow-pink-100 translate-x-2' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} /> {cat.label}
                </div>
                {selectedCategory !== cat.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategoryClick(cat); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar serviço..."
              className="w-full bg-[#F5F5F5] border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-[#FF69B4] outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredServices.length > 0 ? filteredServices.map(svc => (
              <div
                key={svc.id}
                className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: svc.color }}>
                      {(() => {
                        const cat = categories.find(c => c.id === svc.category);
                        const Icon = cat ? (IconMap[cat.iconName] || Sparkles) : Sparkles;
                        return <Icon size={24} />;
                      })()}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg group-hover:text-[#FF69B4] transition-colors">{svc.name}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                        {categories.find(c => c.id === svc.category)?.label || 'Sem Categoria'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-black text-gray-900">R$ {svc.price}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-medium justify-end">
                      <Clock size={12} /> {svc.duration}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  {svc.description}
                </p>

                <div className="flex gap-2 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(svc); }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-400 border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 size={14} /> Editar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(svc); }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-rose-400 border border-rose-50 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Remover
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center text-gray-300 italic">
                Nenhum serviço encontrado nesta categoria...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Confirmar Exclusão de Serviço */}
      {isDeleteModalOpen && serviceToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 border border-white/20 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm mb-2">
              <Trash2 size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">Remover Serviço?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Você tem certeza que deseja remover <span className="font-bold text-gray-800">{serviceToDelete.name}</span>? Essa ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={confirmDeleteService}
                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all"
              >
                Sim, Remover
              </button>
              <button
                onClick={() => { setIsDeleteModalOpen(false); setServiceToDelete(null); }}
                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar/Editar Serviço */}
      {(isModalOpen || (isEditModalOpen && selectedService)) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl space-y-8 fade-in relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${isEditModalOpen ? 'bg-[#40E0D0]/5' : 'bg-[#FF69B4]/5'} rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl`}></div>

            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${isEditModalOpen ? 'bg-[#40E0D0]' : 'bg-[#FF69B4]'}`}>
                  {isEditModalOpen ? <Edit3 size={20} /> : <BookOpen size={20} />}
                </div>
                <h3 className="text-2xl font-bold">{isEditModalOpen ? 'Editar Serviço ⚙️' : 'Novo Serviço 💎'}</h3>
              </div>
              <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); setSelectedService(null); }} className="hover:rotate-90 transition-transform"><X /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome do Serviço</label>
                  <input
                    type="text"
                    placeholder="Ex: Botox Capilar"
                    className={`w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none focus:ring-2 ${isEditModalOpen ? 'focus:ring-[#40E0D0]' : 'focus:ring-[#FF69B4]'}`}
                    value={isEditModalOpen ? selectedService?.name : newSvc.name}
                    onChange={e => isEditModalOpen ? setSelectedService({ ...selectedService!, name: e.target.value }) : setNewSvc({ ...newSvc, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Categoria</label>
                  <select
                    className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none"
                    value={isEditModalOpen ? selectedService?.category : newSvc.category}
                    onChange={e => isEditModalOpen ? setSelectedService({ ...selectedService!, category: e.target.value }) : setNewSvc({ ...newSvc, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Seletor de Cores - Estilo Screenshot */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase block mb-3">Cor Identificadora</label>
                  <div className="flex flex-wrap gap-2.5">
                    {BELLA_PALETTE.map(color => {
                      const isSelected = isEditModalOpen ? selectedService?.color === color : newSvc.color === color;
                      return (
                        <button
                          key={color}
                          onClick={() => isEditModalOpen ? setSelectedService({ ...selectedService!, color }) : setNewSvc({ ...newSvc, color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center shadow-sm ${isSelected ? 'border-gray-900 scale-110 shadow-md ring-2 ring-yellow-400' : 'border-white'}`}
                          style={{ backgroundColor: color }}
                        >
                          {isSelected && <CheckCircle2 size={16} className="text-yellow-400 drop-shadow-md" fill="white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Preço (R$)</label>
                    <input
                      type="number"
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none"
                      value={isEditModalOpen ? selectedService?.price : newSvc.price}
                      onChange={e => isEditModalOpen ? setSelectedService({ ...selectedService!, price: parseInt(e.target.value) || 0 }) : setNewSvc({ ...newSvc, price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Duração</label>
                    <input
                      type="text"
                      placeholder="45min"
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none"
                      value={isEditModalOpen ? selectedService?.duration : newSvc.duration}
                      onChange={e => isEditModalOpen ? setSelectedService({ ...selectedService!, duration: e.target.value }) : setNewSvc({ ...newSvc, duration: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Descrição (Marketing)</label>
                  <textarea
                    className="w-full h-24 bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none resize-none"
                    placeholder="Descreva o serviço para atrair clientes..."
                    value={isEditModalOpen ? selectedService?.description : newSvc.description}
                    onChange={e => isEditModalOpen ? setSelectedService({ ...selectedService!, description: e.target.value }) : setNewSvc({ ...newSvc, description: e.target.value })}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="flex gap-4 relative z-10 pt-4">
              <button
                onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); setSelectedService(null); }}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={isEditModalOpen ? handleUpdate : handleAdd}
                className={`flex-[2] py-4 text-white rounded-2xl font-bold shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 ${isEditModalOpen ? 'bg-[#40E0D0] shadow-teal-100' : 'bg-[#FF69B4] shadow-pink-100'}`}
              >
                {isEditModalOpen ? <><Check size={20} /> Salvar Alterações</> : 'Cadastrar no Menu ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar Categorias */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Nova Categoria 📁</h3>
              <button onClick={() => setIsCatModalOpen(false)}><X /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome da Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Maquiagem"
                  className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF69B4]"
                  value={newCat.label}
                  onChange={e => setNewCat({ ...newCat, label: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Ícone Representativo</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.keys(IconMap).map(iconName => {
                    const Icon = IconMap[iconName];
                    return (
                      <button
                        key={iconName}
                        onClick={() => setNewCat({ ...newCat, iconName })}
                        className={`p-3 rounded-xl flex items-center justify-center border-2 transition-all ${newCat.iconName === iconName ? 'border-[#FF69B4] bg-[#FF69B4]/10 text-[#FF69B4]' : 'border-gray-50 text-gray-300'}`}
                      >
                        <Icon size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={handleAddCategory}
                className="w-full py-4 bg-[#FF69B4] text-white rounded-2xl font-bold shadow-lg shadow-pink-100 mt-4 active:scale-95 transition-transform"
              >
                Criar Categoria 🌸
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Categoria */}
      {isDeleteCatModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 border border-white/20 text-center">
            {getServiceCountByCategory(categoryToDelete.id) > 0 ? (
              <>
                <div className="w-20 h-20 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-500 mx-auto shadow-sm mb-2">
                  <AlertTriangle size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900">Não é possível excluir</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    A categoria <span className="font-bold text-gray-800">{categoryToDelete.label}</span> possui <span className="font-bold text-[#FF69B4]">{getServiceCountByCategory(categoryToDelete.id)} serviços</span> vinculados. Remova os serviços antes de excluir a categoria.
                  </p>
                </div>

                <button
                  onClick={() => setIsDeleteCatModalOpen(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Entendido
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm mb-2">
                  <Trash2 size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900">Excluir Categoria?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Você tem certeza que deseja remover a categoria <span className="font-bold text-gray-800">{categoryToDelete.label}</span>? Essa ação não pode ser desfeita.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={confirmDeleteCategory}
                    className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all"
                  >
                    Sim, Excluir
                  </button>
                  <button
                    onClick={() => { setIsDeleteCatModalOpen(false); setCategoryToDelete(null); }}
                    className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesView;
