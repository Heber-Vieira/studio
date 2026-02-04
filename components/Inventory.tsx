
import React, { useState, useMemo } from 'react';
import { InventoryItem, Transaction, Category } from '../types';
import {
   Search, Plus, Package, ShoppingBag, AlertCircle,
   TrendingDown, TrendingUp, Filter, Trash2, Edit3,
   CheckCircle2, AlertTriangle, X, DollarSign, FolderPlus,
   Tag, Scissors, Sparkles, Wand2, Droplet,
   Brush, SprayCan, Palette, Gem, Crown, Gift, Zap, Box, Heart, Smile
} from 'lucide-react';
import { Modal, Button, CurrencyInput } from './ui';

interface InventoryViewProps {
   inventory: InventoryItem[];
   categories: Category[];
   onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
   onUpdateItem: (item: InventoryItem) => void;
   onDeleteItem: (id: string) => void;
   onStockMovement: (id: string, newQuantity: number) => void;
   onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
   onAddCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
   onDeleteCategory: (id: string) => Promise<void>;
   onShowToast: (msg: string) => void;
}

const IconMap: Record<string, any> = {
   Package,
   ShoppingBag,
   Scissors,
   Sparkles,
   Tag,
   Droplet,
   Wand2,
   Brush,
   SprayCan,
   Palette,
   Gem,
   Crown,
   Gift,
   Zap,
   Box,
   Heart,
   Smile
};

const InventoryView: React.FC<InventoryViewProps> = ({
   inventory,
   categories,
   onAddItem,
   onUpdateItem,
   onDeleteItem,
   onStockMovement,
   onAddTransaction,
   onAddCategory,
   onDeleteCategory,
   onShowToast
}) => {
   const [activeTab, setActiveTab] = useState<'all' | 'consumable' | 'resale'>('all');
   const [searchTerm, setSearchTerm] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

   // Category Management State
   const [isCatModalOpen, setIsCatModalOpen] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [newCat, setNewCat] = useState({ label: '', iconName: 'Tag' });
   const [isDeleteCatModalOpen, setIsDeleteCatModalOpen] = useState(false);
   const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

   // Delete Modal States
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

   const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

   // State for Add/Edit Form
   const [formData, setFormData] = useState<Partial<InventoryItem>>({
      name: '', type: 'consumable', category: '', quantity: 0, unit: 'un', minLevel: 5, costPrice: 0, salePrice: 0, supplier: ''
   });

   // State for Movement (Restock/Use/Sell)
   const [movementData, setMovementData] = useState({
      type: 'add' as 'add' | 'remove',
      quantity: 1,
      recordFinancial: true
   });

   // Calculations
   const filteredItems = inventory.filter(item => {
      const matchTab = activeTab === 'all' || item.type === activeTab;
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTab && matchSearch;
   });

   const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
   const lowStockCount = inventory.filter(item => item.quantity <= item.minLevel).length;
   const resalePotential = inventory
      .filter(item => item.type === 'resale' && item.salePrice)
      .reduce((acc, item) => acc + (item.quantity * (item.salePrice! - item.costPrice)), 0);

   // Handlers
   const handleOpenModal = (item?: InventoryItem) => {
      if (item) {
         setSelectedItem(item);
         setFormData(item);
      } else {
         setSelectedItem(null);
         setFormData({
            name: '',
            type: 'consumable',
            category: categories[0]?.label || '',
            quantity: 0,
            unit: 'un',
            minLevel: 5,
            costPrice: 0,
            salePrice: 0,
            supplier: ''
         });
      }
      setIsModalOpen(true);
   };

   const handleSaveItem = async () => {
      if (!formData.name) return;
      setIsSaving(true);

      try {
         if (selectedItem) {
            onUpdateItem({
               ...formData,
               id: selectedItem.id,
               quantity: Number(formData.quantity) || 0,
               minLevel: Number(formData.minLevel) || 0,
               costPrice: Number(formData.costPrice) || 0,
               salePrice: Number(formData.salePrice) || 0
            } as InventoryItem);
         } else {
            onAddItem({
               name: formData.name,
               type: formData.type || 'consumable',
               category: formData.category || categories[0]?.label || '',
               quantity: Number(formData.quantity) || 0,
               unit: formData.unit || 'un',
               minLevel: Number(formData.minLevel) || 0,
               costPrice: Number(formData.costPrice) || 0,
               salePrice: Number(formData.salePrice) || 0,
               supplier: formData.supplier || ''
            });
         }
         setIsModalOpen(false);
      } finally {
         setIsSaving(false);
      }
   };

   const handleMovementClick = (item: InventoryItem, type: 'add' | 'remove') => {
      setSelectedItem(item);
      setMovementData({ type, quantity: 1, recordFinancial: true });
      setIsMovementModalOpen(true);
   };

   const handleDeleteClick = (item: InventoryItem) => {
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
   };

   const confirmDelete = () => {
      if (itemToDelete) {
         onDeleteItem(itemToDelete.id);
         setIsDeleteModalOpen(false);
         setItemToDelete(null);
         onShowToast("Item removido do estoque.");
      }
   };

   const confirmMovement = () => {
      if (!selectedItem) return;

      const qtyChange = Number(movementData.quantity);
      if (qtyChange <= 0) return;

      let newQty = selectedItem.quantity;
      if (movementData.type === 'add') {
         newQty += qtyChange;

         // Financial Logic for Restock (Expense)
         if (movementData.recordFinancial) {
            const totalCost = qtyChange * selectedItem.costPrice;
            onAddTransaction({
               type: 'expense',
               title: `Compra: ${selectedItem.name}`,
               client: selectedItem.supplier || 'Fornecedor',
               amount: totalCost,
               method: 'Dinheiro', // Default, could be enhanced
               date: new Date().toISOString()
            });
         }
      } else {
         newQty = Math.max(0, newQty - qtyChange);

         // Financial Logic for Sale (Income) - Only for resale items
         if (movementData.recordFinancial && selectedItem.type === 'resale' && selectedItem.salePrice) {
            const totalSale = qtyChange * selectedItem.salePrice;
            onAddTransaction({
               type: 'income',
               title: `Venda Produto: ${selectedItem.name}`,
               client: 'Venda Balcão',
               amount: totalSale,
               method: 'Dinheiro',
               date: new Date().toISOString()
            });
         }
      }

      onStockMovement(selectedItem.id, newQty);
      setIsMovementModalOpen(false);
      onShowToast("Movimentação registrada! ✨");
   };

   const handleAddCategory = async () => {
      if (!newCat.label) return;
      setIsSaving(true);
      try {
         await onAddCategory({
            label: newCat.label,
            iconName: newCat.iconName
         });
         setNewCat({ label: '', iconName: 'Tag' });
      } finally {
         setIsSaving(false);
      }
   };

   const handleDeleteCategoryClick = (cat: Category) => {
      setCategoryToDelete(cat);
      setIsDeleteCatModalOpen(true);
   };

   const confirmDeleteCategory = async () => {
      if (categoryToDelete) {
         await onDeleteCategory(categoryToDelete.id);
         setIsDeleteCatModalOpen(false);
         setCategoryToDelete(null);
         onShowToast("Categoria removida.");
      }
   };

   const getItemsCountByCategory = (catLabel: string) => {
      return inventory.filter(i => i.category === catLabel).length;
   };

   return (
      <div className="space-y-8 fade-in pb-20">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h2 className="text-2xl font-bold">Controle de Estoque 📦</h2>
               <p className="text-gray-500 text-sm">Gerencie insumos e produtos para revenda com inteligência.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                     type="text"
                     placeholder="Buscar item..."
                     className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-pink-300"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <button
                  onClick={() => setIsCatModalOpen(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all"
               >
                  <FolderPlus size={18} /> Categorias
               </button>
               <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 bg-[#FF69B4] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-100 hover:scale-[1.05] active:scale-95 transition-transform"
               >
                  <Plus size={18} /> Novo Item
               </button>
            </div>
         </div>

         {/* KPIs */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Valor em Estoque</p>
                  <h3 className="text-2xl font-black text-gray-900">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
               </div>
               <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                  <Package size={24} />
               </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Itens Críticos</p>
                  <h3 className={`text-2xl font-black ${lowStockCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{lowStockCount}</h3>
               </div>
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  <AlertCircle size={24} />
               </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Potencial de Lucro (Revenda)</p>
                  <h3 className="text-2xl font-black text-emerald-600">R$ {resalePotential.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
               </div>
               <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} />
               </div>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex p-1 bg-gray-100 rounded-2xl w-full md:w-fit">
            <button
               onClick={() => setActiveTab('all')}
               className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
               Todos
            </button>
            <button
               onClick={() => setActiveTab('consumable')}
               className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'consumable' ? 'bg-white text-[#FF69B4] shadow-sm' : 'text-gray-500'}`}
            >
               <Package size={16} /> Uso Interno
            </button>
            <button
               onClick={() => setActiveTab('resale')}
               className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'resale' ? 'bg-white text-[#40E0D0] shadow-sm' : 'text-gray-500'}`}
            >
               <ShoppingBag size={16} /> Revenda
            </button>
         </div>

         {/* Grid List */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredItems.map(item => {
               const stockPercentage = Math.min(100, (item.quantity / (item.minLevel * 2)) * 100);
               const isLowStock = item.quantity <= item.minLevel;
               const stockColor = isLowStock ? 'bg-rose-500' : stockPercentage < 50 ? 'bg-amber-400' : 'bg-emerald-400';

               return (
                  <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.type === 'consumable' ? 'bg-pink-50 text-pink-500' : 'bg-teal-50 text-teal-500'}`}>
                              {item.type === 'consumable' ? <Package size={24} /> : <ShoppingBag size={24} />}
                           </div>
                           <div>
                              <h4 className="font-bold text-lg text-gray-900 leading-tight">{item.name}</h4>
                              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{item.category} • {item.supplier}</span>
                           </div>
                        </div>
                        <div className="flex gap-1">
                           <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                           <button onClick={() => handleDeleteClick(item)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                     </div>

                     <div className="mb-6">
                        <div className="flex justify-between items-end mb-2">
                           <span className="text-sm font-medium text-gray-600">Estoque: <strong className="text-gray-900">{item.quantity} {item.unit}</strong></span>
                           {isLowStock && <span className="text-xs font-bold text-rose-500 flex items-center gap-1 animate-pulse"><AlertTriangle size={12} /> Repor estoque</span>}
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                           <div className={`h-full ${stockColor} rounded-full transition-all duration-500`} style={{ width: `${stockPercentage}%` }}></div>
                        </div>
                     </div>

                     <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                        <div className="text-xs">
                           <span className="block text-gray-400 font-bold uppercase">Custo</span>
                           <span className="font-black text-gray-900">R$ {item.costPrice.toFixed(2)}</span>
                        </div>
                        {item.type === 'resale' && (
                           <div className="text-xs text-center border-l border-gray-100 pl-4">
                              <span className="block text-gray-400 font-bold uppercase">Venda</span>
                              <span className="font-black text-emerald-600">R$ {item.salePrice?.toFixed(2)}</span>
                           </div>
                        )}

                        <div className="flex gap-2 ml-auto">
                           <button
                              onClick={() => handleMovementClick(item, 'remove')}
                              className="px-4 py-2 bg-gray-100 hover:bg-rose-50 hover:text-rose-500 text-gray-600 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                           >
                              <TrendingDown size={14} /> {item.type === 'resale' ? 'Vender' : 'Usar'}
                           </button>
                           <button
                              onClick={() => handleMovementClick(item, 'add')}
                              className="px-4 py-2 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-500 text-gray-600 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                           >
                              <TrendingUp size={14} /> Repor
                           </button>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>

         {/* Modal: Confirm Delete Item */}
         {isDeleteModalOpen && itemToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
               <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 border border-white/20 text-center">
                  <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm mb-2">
                     <Trash2 size={32} />
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-xl font-black text-gray-900">Remover Item?</h3>
                     <p className="text-sm text-gray-500 leading-relaxed">
                        Você tem certeza que deseja remover <span className="font-bold text-gray-800">{itemToDelete.name}</span> do estoque? Essa ação não pode ser desfeita.
                     </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                     <button
                        onClick={confirmDelete}
                        className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all"
                     >
                        Sim, Remover
                     </button>
                     <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
                     >
                        Cancelar
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal: Confirmar Exclusão de Categoria */}
         <Modal
            isOpen={isDeleteCatModalOpen && !!categoryToDelete}
            onClose={() => { setIsDeleteCatModalOpen(false); setCategoryToDelete(null); }}
            title={getItemsCountByCategory(categoryToDelete?.label || '') > 0 ? "Categoria em Uso" : "Excluir Categoria?"}
         >
            <div className="text-center space-y-6">
               {getItemsCountByCategory(categoryToDelete?.label || '') > 0 ? (
                  <>
                     <div className="w-20 h-20 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-500 mx-auto shadow-sm">
                        <AlertTriangle size={32} />
                     </div>

                     <div className="space-y-2">
                        <p className="text-sm text-gray-500 leading-relaxed">
                           A categoria <span className="font-bold text-gray-800">{categoryToDelete?.label}</span> possui <span className="font-bold text-[#FF69B4]">{getItemsCountByCategory(categoryToDelete?.label || '')} itens</span> no estoque. Remova ou mova os itens antes de excluir.
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

         {/* Modal: Gerenciar Categorias */}
         <Modal
            isOpen={isCatModalOpen}
            onClose={() => setIsCatModalOpen(false)}
            title="Categorias de Estoque 📁"
         >
            <div className="space-y-6">
               {/* Lista Existente */}
               <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-hide bg-gray-50 p-2 rounded-xl">
                  {(categories || []).map(cat => {
                     const Icon = IconMap[cat.iconName] || Tag;
                     return (
                        <div key={cat.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#FF69B4]/10 rounded-lg flex items-center justify-center text-[#FF69B4]">
                                 <Icon size={16} />
                              </div>
                              <span className="font-bold text-gray-700">{cat.label}</span>
                           </div>
                           <button onClick={() => handleDeleteCategoryClick(cat)} className="text-gray-400 hover:text-rose-500 transition-colors p-1">
                              <Trash2 size={16} />
                           </button>
                        </div>
                     );
                  })}
               </div>

               <div className="h-px bg-gray-100 w-full" />

               {/* Form Add Nova */}
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nova Categoria</label>
                     <input
                        type="text"
                        placeholder="Ex: Maquiagem"
                        className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF69B4]"
                        value={newCat.label}
                        onChange={e => setNewCat({ ...newCat, label: e.target.value })}
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Ícone</label>
                     <div className="grid grid-cols-6 gap-2">
                        {Object.keys(IconMap).map(iconName => {
                           const Icon = IconMap[iconName];
                           return (
                              <button
                                 key={iconName}
                                 onClick={() => setNewCat({ ...newCat, iconName })}
                                 className={`p-2 rounded-xl flex items-center justify-center border-2 transition-all ${newCat.iconName === iconName ? 'border-[#FF69B4] bg-[#FF69B4]/10 text-[#FF69B4]' : 'border-gray-50 text-gray-300'}`}
                              >
                                 <Icon size={18} />
                              </button>
                           );
                        })}
                     </div>
                  </div>
                  <Button
                     variant="primary"
                     fullWidth
                     disabled={isSaving}
                     onClick={handleAddCategory}
                     icon={isSaving ? <Plus className="animate-spin" /> : <Plus />}
                  >
                     Adicionar Categoria
                  </Button>
               </div>
            </div>
         </Modal>

         {/* Modal: Add/Edit Item */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
                  <div className="flex justify-between items-center">
                     <h3 className="text-2xl font-bold text-gray-900">{selectedItem ? 'Editar Item' : 'Novo Item'} ✨</h3>
                     <button onClick={() => setIsModalOpen(false)}><X /></button>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome do Item</label>
                        <input type="text" className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Tipo</label>
                           <select
                              className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none font-medium"
                              value={formData.type}
                              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                           >
                              <option value="consumable">Uso Interno (Insumo)</option>
                              <option value="resale">Produto Revenda</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Categoria</label>
                           <select
                              className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none font-medium"
                              value={formData.category}
                              onChange={e => setFormData({ ...formData, category: e.target.value })}
                           >
                              <option value="">Sem Categoria</option>
                              {(categories || []).map(cat => (
                                 <option key={cat.id} value={cat.label}>{cat.label}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4">
                        <div>
                           <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Estoque Atual</label>
                           <input type="number" className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none font-bold" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Unidade</label>
                           <input type="text" placeholder="un, ml" className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Mínimo</label>
                           <input type="number" className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none" value={formData.minLevel} onChange={e => setFormData({ ...formData, minLevel: Number(e.target.value) })} />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <CurrencyInput
                           label="Preço Custo"
                           value={formData.costPrice || 0}
                           onChange={val => setFormData({ ...formData, costPrice: val })}
                           placeholder="R$ 0,00"
                        />
                        {formData.type === 'resale' && (
                           <CurrencyInput
                              label="Preço Venda"
                              value={formData.salePrice || 0}
                              onChange={val => setFormData({ ...formData, salePrice: val })}
                              placeholder="R$ 0,00"
                           />
                        )}
                     </div>

                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Fornecedor</label>
                        <input type="text" className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 outline-none" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                     </div>

                     <button
                        onClick={handleSaveItem}
                        disabled={isSaving}
                        className="w-full py-4 bg-[#FF69B4] text-white rounded-2xl font-bold shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                        {isSaving ? <Plus className="animate-spin" size={18} /> : (selectedItem ? 'Salvar Alterações' : 'Salvar Item')}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal: Movement (Add/Remove) */}
         {isMovementModalOpen && selectedItem && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
                  <div className="text-center">
                     <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${movementData.type === 'add' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {movementData.type === 'add' ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                     </div>
                     <h3 className="text-xl font-black text-gray-900">{movementData.type === 'add' ? 'Repor Estoque' : (selectedItem.type === 'resale' ? 'Registrar Venda' : 'Registrar Uso')}</h3>
                     <p className="text-gray-500 text-sm mt-1">{selectedItem.name}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-center gap-4">
                     <button onClick={() => setMovementData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))} className="w-10 h-10 bg-white shadow-sm rounded-lg font-bold text-xl text-gray-400 hover:text-gray-900">-</button>
                     <span className="text-3xl font-black text-gray-900">{movementData.quantity}</span>
                     <button onClick={() => setMovementData(prev => ({ ...prev, quantity: prev.quantity + 1 }))} className="w-10 h-10 bg-white shadow-sm rounded-lg font-bold text-xl text-gray-400 hover:text-gray-900">+</button>
                  </div>

                  {/* Financial Integration Toggle */}
                  <div
                     className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${movementData.recordFinancial ? (movementData.type === 'add' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100') : 'bg-gray-50 border-transparent'}`}
                     onClick={() => setMovementData(prev => ({ ...prev, recordFinancial: !prev.recordFinancial }))}
                  >
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${movementData.recordFinancial ? 'bg-white border-transparent' : 'border-gray-300'}`}>
                        {movementData.recordFinancial && <CheckCircle2 size={16} className={movementData.type === 'add' ? 'text-rose-500' : 'text-emerald-500'} />}
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-gray-800">
                           {movementData.type === 'add' ? 'Lançar Despesa (Compra)' : 'Lançar Receita (Venda)'}
                        </p>
                        {movementData.recordFinancial && (
                           <p className="text-[10px] font-bold opacity-70">
                              Valor Total: R$ {((movementData.type === 'add' ? selectedItem.costPrice : (selectedItem.salePrice || 0)) * movementData.quantity).toFixed(2)}
                           </p>
                        )}
                     </div>
                     <DollarSign size={16} className="opacity-30" />
                  </div>

                  <div className="flex gap-3">
                     <button onClick={() => setIsMovementModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                     <button
                        onClick={confirmMovement}
                        className={`flex-[2] py-3 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${movementData.type === 'add' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'}`}
                     >
                        Confirmar
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default InventoryView;
