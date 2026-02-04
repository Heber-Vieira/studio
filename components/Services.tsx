
import React, { useState, useMemo } from 'react';
import { Service, Category } from '../types';
import { COLORS } from '../constants';
import {
  Plus, Search, Clock, Tag, X, Scissors, Droplet, Sparkles,
  Wand2, BookOpen, Trash2, Edit3, Check, FolderPlus, AlertTriangle,
  Brush, SprayCan, Palette, Gem, Crown, Gift, Zap, Heart, Smile,
  CheckCircle2
} from 'lucide-react';
import { TimePicker, CurrencyInput, Modal, Button } from './ui';

interface ServicesProps {
  services: Service[];
  categories: Category[];
  onAdd: (service: Omit<Service, 'id'>) => Promise<void> | void;
  onUpdate: (service: Service) => Promise<void> | void;
  onDelete: (id: string) => void;
  onAddCategory: (cat: Omit<Category, 'id'>) => Promise<void> | void;
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

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'new' | 'edit'>('new');

  const [newCat, setNewCat] = useState({ label: '', iconName: 'Tag' });

  const filteredServices = services.filter(s =>
    (selectedCategory === 'all' || s.category === selectedCategory) &&
    (
      (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (s.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
  );

  const handleAdd = async () => {
    if (!newSvc.name) return;
    try {
      await onAdd({
        name: newSvc.name,
        category: newSvc.category,
        price: newSvc.price,
        duration: newSvc.duration,
        description: newSvc.description,
        color: newSvc.color
      });
      setIsModalOpen(false);
      setNewSvc({ name: '', category: categories[0]?.id || '', price: 0, duration: '1h', description: '', color: BELLA_PALETTE[0] });
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCat.label) return;
    try {
      await onAddCategory({
        label: newCat.label,
        iconName: newCat.iconName
      });
      setIsCatModalOpen(false);
      setNewCat({ label: '', iconName: 'Tag' });
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleEdit = (svc: Service) => {
    setSelectedService(svc);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedService || !selectedService.name) return;
    try {
      await onUpdate(selectedService);
      setIsEditModalOpen(false);
      setSelectedService(null);
    } catch (error) {
      console.error("Error updating service:", error);
    }
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
    return services.filter(s => s.category === catId || (categories.find(c => c.id === catId)?.label === s.category)).length;
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
            onClick={() => {
              setNewSvc({
                ...newSvc,
                category: selectedCategory === 'all' ? (categories[0]?.id || '') : selectedCategory
              });
              setIsModalOpen(true);
            }}
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
          {(categories || []).map(cat => {
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
                        const cat = categories.find(c => c.id === svc.category || c.label === svc.category);
                        const Icon = cat ? (IconMap[cat.iconName] || Sparkles) : Sparkles;
                        return <Icon size={24} />;
                      })()}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg group-hover:text-[#FF69B4] transition-colors">{svc.name}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                        {(() => {
                          const cat = categories.find(c => c.id === svc.category || c.label === svc.category);
                          return cat ? cat.label : (svc.category || 'Sem Categoria');
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-black text-gray-900">R$ {svc.price}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-medium justify-end">
                      <Clock size={12} /> {svc.duration.replace(';', ':')}
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
      <Modal
        isOpen={isDeleteModalOpen && !!serviceToDelete}
        onClose={() => { setIsDeleteModalOpen(false); setServiceToDelete(null); }}
        title="Remover Serviço?"
      >
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm">
            <Trash2 size={32} />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500 leading-relaxed">
              Você tem certeza que deseja remover <span className="font-bold text-gray-800">{serviceToDelete?.name}</span>? Essa ação não pode ser desfeita.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="danger"
              fullWidth
              onClick={confirmDeleteService}
            >
              Sim, Remover
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setIsDeleteModalOpen(false); setServiceToDelete(null); }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Adicionar/Editar Serviço */}
      <Modal
        isOpen={isModalOpen || (isEditModalOpen && !!selectedService)}
        onClose={() => { setIsModalOpen(false); setIsEditModalOpen(false); setSelectedService(null); }}
        title={isEditModalOpen ? 'Editar Serviço ⚙️' : 'Novo Serviço 💎'}
        icon={isEditModalOpen ? <Edit3 size={24} /> : <BookOpen size={24} />}
        iconBgColor={isEditModalOpen ? 'bg-[#40E0D0]' : 'bg-[#FF69B4]'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <option value="">Sem Categoria</option>
                {(categories || []).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Seletor de Cores */}
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
              <CurrencyInput
                label="Preço"
                value={isEditModalOpen ? (selectedService?.price || 0) : newSvc.price}
                onChange={val => isEditModalOpen
                  ? setSelectedService({ ...selectedService!, price: val })
                  : setNewSvc({ ...newSvc, price: val })
                }
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Duração</label>
                <button
                  type="button"
                  onClick={() => {
                    setTimePickerTarget(isEditModalOpen ? 'edit' : 'new');
                    setIsTimePickerOpen(true);
                  }}
                  className="w-full bg-[#F5F5F5] border-none rounded-2xl py-4 px-6 outline-none text-left font-bold text-gray-800 hover:ring-2 hover:ring-[#FF69B4]/20 transition-all flex items-center justify-between"
                >
                  <span className="text-sm">{isEditModalOpen ? selectedService?.duration : newSvc.duration}</span>
                  <Clock size={16} className="text-gray-300" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Descrição (Marketing)</label>
              <textarea
                className="w-full h-24 bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none resize-none text-sm font-medium"
                placeholder="Descreva o serviço para atrair clientes..."
                value={isEditModalOpen ? selectedService?.description : newSvc.description}
                onChange={e => isEditModalOpen ? setSelectedService({ ...selectedService!, description: e.target.value }) : setNewSvc({ ...newSvc, description: e.target.value })}
              ></textarea>
            </div>
          </div>
        </div>

        <TimePicker
          isOpen={isTimePickerOpen}
          onClose={() => setIsTimePickerOpen(false)}
          onConfirm={(h, m) => {
            const durationStr = `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}min` : ''}`.trim() || '30min';
            if (timePickerTarget === 'edit' && selectedService) {
              setSelectedService({ ...selectedService, duration: durationStr });
            } else {
              setNewSvc({ ...newSvc, duration: durationStr });
            }
          }}
          initialHours={(() => {
            const dur = timePickerTarget === 'edit' ? selectedService?.duration : newSvc.duration;
            const hours = dur?.match(/(\d+)h/);
            return hours ? parseInt(hours[1]) : 0;
          })()}
          initialMinutes={(() => {
            const dur = timePickerTarget === 'edit' ? selectedService?.duration : newSvc.duration;
            const mins = dur?.match(/(\d+)min/);
            return mins ? parseInt(mins[1]) : (dur?.includes('h') ? 0 : 30);
          })()}
        />

        <div className="flex gap-4 pt-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); setSelectedService(null); }}
          >
            Cancelar
          </Button>
          <Button
            variant={isEditModalOpen ? "success" : "primary"}
            fullWidth
            icon={<Check size={20} />}
            onClick={isEditModalOpen ? handleUpdate : handleAdd}
          >
            {isEditModalOpen ? 'Salvar Alterações' : 'Cadastrar no Menu ✨'}
          </Button>
        </div>
      </Modal>

      {/* Modal: Gerenciar Categorias */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Nova Categoria 📁"
      >
        <div className="space-y-6">
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
          <Button
            fullWidth
            onClick={handleAddCategory}
          >
            Criar Categoria 🌸
          </Button>
        </div>
      </Modal>

      {/* Modal: Confirmar Exclusão de Categoria */}
      <Modal
        isOpen={isDeleteCatModalOpen && !!categoryToDelete}
        onClose={() => { setIsDeleteCatModalOpen(false); setCategoryToDelete(null); }}
        title={getServiceCountByCategory(categoryToDelete?.id || '') > 0 ? "Não é possível excluir" : "Excluir Categoria?"}
      >
        <div className="text-center space-y-6">
          {getServiceCountByCategory(categoryToDelete?.id || '') > 0 ? (
            <>
              <div className="w-20 h-20 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-500 mx-auto shadow-sm">
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500 leading-relaxed">
                  A categoria <span className="font-bold text-gray-800">{categoryToDelete?.label}</span> possui <span className="font-bold text-[#FF69B4]">{getServiceCountByCategory(categoryToDelete?.id || '')} serviços</span> vinculados. Remova os serviços antes de excluir a categoria.
                </p>
              </div>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => setIsDeleteCatModalOpen(false)}
              >
                Entendido
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm">
                <Trash2 size={32} />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Você tem certeza que deseja remover a categoria <span className="font-bold text-gray-800">{categoryToDelete?.label}</span>? Essa ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={confirmDeleteCategory}
                >
                  Sim, Excluir
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => { setIsDeleteCatModalOpen(false); setCategoryToDelete(null); }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ServicesView;
