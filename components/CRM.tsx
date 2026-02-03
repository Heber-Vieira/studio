
import React, { useState, useRef, useMemo } from 'react';
import { Client, Appointment, SalonSettings } from '../types';
import { UserPlus, Search, Phone, History, Star, X, CheckCircle2, Calendar, Sparkles, Trash2, AlertTriangle, Gift, Smartphone, Upload, Edit3, Save, Link2, ExternalLink, Copy, MessageCircle } from 'lucide-react';
import { Modal, Button, InputField } from './ui';

interface CRMProps {
  clients: Client[];
  onAdd: (client: Omit<Client, 'id'>) => void;
  onUpdate: (client: Client) => void;
  onDelete: (id: string) => void;
  onRedeem: (clientId: string) => void;
  onPrefilledBooking: (client: { name: string; phone: string }) => void;
  appointments: Appointment[];
  settings: SalonSettings;
  t: any;
  onShowToast: (msg: string) => void;
}

const CRMView: React.FC<CRMProps> = ({ clients, onAdd, onUpdate, onDelete, onRedeem, onPrefilledBooking, appointments, settings, t, onShowToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<Client | null>(null);
  const [viewingLoyalty, setViewingLoyalty] = useState<Client | null>(null);
  const [isRedeemSuccess, setIsRedeemSuccess] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', birthDate: '' });
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Magic Link Modal State
  const [activeMagicClient, setActiveMagicClient] = useState<Client | null>(null);

  // States for Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substr(0, 15);
    }
    return value.substr(0, 15);
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleAdd = () => {
    if (!newClient.name || !newClient.phone) return;
    onAdd({
      name: newClient.name,
      phone: newClient.phone,
      birthDate: newClient.birthDate || undefined,
      lastVisit: new Date().toISOString().split('T')[0],
      totalSpent: 0,
      loyaltyPoints: 0,
      tags: ['Novo']
    });
    setIsModalOpen(false);
    setNewClient({ name: '', phone: '', birthDate: '' });
  };

  const handleEditClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setEditingClient({ ...client });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingClient && editingClient.name && editingClient.phone) {
      onUpdate(editingClient);
      setIsEditModalOpen(false);
      setEditingClient(null);
    }
  };

  /**
   * ULTRA-ROBUST LINK GENERATION
   * Usando hash (#booking) para garantir que o servidor não procure arquivos inexistentes.
   */
  const generatedMagicLink = useMemo(() => {
    if (!activeMagicClient) return '';
    const baseUrl = window.location.href.split('#')[0].split('?')[0];
    const nameParam = encodeURIComponent(activeMagicClient.name);
    const phoneParam = encodeURIComponent(activeMagicClient.phone);
    return `${baseUrl}#booking?pn=${nameParam}&pp=${phoneParam}`;
  }, [activeMagicClient]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      onShowToast("Link copiado com sucesso! ✨");
    }).catch(err => {
      console.error("Copy failed", err);
      onShowToast("Link gerado! Por favor, copie manualmente.");
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      let importedCount = 0;

      lines.forEach(line => {
        const cleanLine = line.replace(/"/g, '').trim();
        if (!cleanLine) return;

        const parts = cleanLine.split(/[;,]/);

        if (parts.length >= 2) {
          const name = parts[0].trim();
          const rawPhone = parts[1].trim();
          const cleanPhone = rawPhone.replace(/\D/g, '');

          if (name && cleanPhone.length >= 8) {
            const exists = clients.some(c => c.phone.replace(/\D/g, '') === cleanPhone);

            if (!exists) {
              onAdd({
                name: name,
                phone: formatPhoneNumber(cleanPhone),
                lastVisit: new Date().toISOString().split('T')[0],
                totalSpent: 0,
                loyaltyPoints: 0,
                tags: ['Importado CSV']
              });
              importedCount++;
            }
          }
        }
      });

      if (importedCount > 0) {
        onShowToast('Nenhum contato novo encontrado ou formato inválido. Use "Nome,Telefone".');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportContacts = async () => {
    const nav = navigator as any;
    const isSupported = 'contacts' in navigator && 'ContactsManager' in window;

    if (isSupported) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };

        const contacts = await nav.contacts.select(props, opts);

        if (!contacts || contacts.length === 0) return;

        let importedCount = 0;

        contacts.forEach((contact: any) => {
          const name = contact.name?.[0];
          const rawPhone = contact.tel?.[0];

          if (name && rawPhone) {
            const cleanPhone = rawPhone.replace(/\D/g, '');
            let formattedPhone = rawPhone;
            if (cleanPhone.length >= 10) {
              formattedPhone = formatPhoneNumber(cleanPhone);
            }

            const exists = clients.some(c => c.phone.replace(/\D/g, '') === cleanPhone);

            if (!exists) {
              onAdd({
                name: name,
                phone: formattedPhone,
                lastVisit: new Date().toISOString().split('T')[0],
                totalSpent: 0,
                loyaltyPoints: 0,
                tags: ['Importado']
              });
              importedCount++;
            }
          }
        });

        if (importedCount > 0) {
          onShowToast(`${importedCount} contatos da agenda importados com sucesso!`);
        } else if (contacts.length > 0) {
          onShowToast('Os contatos selecionados já estão cadastrados.');
        }

      } catch (ex) {
        console.log('Importação cancelada ou falhou', ex);
      }
    } else {
      onShowToast("Importação via agenda disponível apenas em dispositivos móveis.");
    }
  };

  const getClientHistory = (clientId: string) => {
    return appointments.filter(apt => apt.clientId === clientId);
  };

  const handleRedeem = () => {
    if (viewingLoyalty) {
      onRedeem(viewingLoyalty.id);
      setIsRedeemSuccess(true);
      setTimeout(() => {
        setIsRedeemSuccess(false);
        setViewingLoyalty(null);
      }, 2500);
    }
  };

  const closeLoyalty = () => {
    setViewingLoyalty(null);
    setIsRedeemSuccess(false);
  };

  const loyaltyConfig = settings.loyalty;

  return (
    <div className="space-y-6 fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">{t.crm.title} <span className="text-gray-400 font-normal">({clients.length})</span></h2>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={t.crm.searchPlaceholder}
              className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-pink-300"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.txt"
            onChange={handleFileImport}
          />

          <button
            onClick={handleImportContacts}
            className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-100 active:scale-95 transition-all shadow-sm"
            title="Importar da Agenda ou Arquivo"
          >
            <Smartphone size={18} /> <span className="hidden lg:inline">Importar</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#FF69B4] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-100 hover:scale-[1.05] active:scale-95 transition-transform"
          >
            <UserPlus size={18} /> {t.crm.newClient}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-[#40E0D0] transition-all relative overflow-hidden group">

            {/* Header: Avatar, Name and Actions Flexbox */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#40E0D0]/10 flex items-center justify-center text-[#40E0D0] font-bold text-xl">
                  {client.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 truncate leading-tight" title={client.name}>{client.name}</h3>
                  <p className="text-sm text-gray-400 font-medium">{client.phone}</p>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMagicClient(client); }}
                  className="p-2 bg-teal-50 rounded-xl text-[#40E0D0] hover:text-white hover:bg-[#40E0D0] transition-all shadow-sm active:scale-90"
                  title="Link de Agendamento"
                >
                  <Link2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const cleanPhone = client.phone.replace(/\D/g, '');
                    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                  }}
                  className="p-2 bg-emerald-50 rounded-xl text-emerald-500 hover:text-white hover:bg-emerald-500 transition-all shadow-sm active:scale-90"
                  title="WhatsApp"
                >
                  <MessageCircle size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${client.phone}`);
                  }}
                  className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all shadow-sm active:scale-90"
                  title="Ligar"
                >
                  <Phone size={16} />
                </button>
                <button
                  onClick={(e) => handleEditClick(e, client)}
                  className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-[#FF69B4] hover:bg-pink-50 transition-all shadow-sm active:scale-90"
                  title="Editar Cliente"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setClientToDelete(client); setIsDeleteModalOpen(true); }}
                  className="p-2 bg-rose-50 rounded-xl text-rose-300 hover:text-rose-600 hover:bg-rose-100 transition-all shadow-sm active:scale-90"
                  title="Remover Cliente"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#F5F5F5] p-3 rounded-2xl">
                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">{t.crm.totalSpent}</span>
                <span className="font-bold">R$ {client.totalSpent}</span>
              </div>
              <div className="bg-[#F5F5F5] p-3 rounded-2xl">
                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">{t.crm.lastVisit}</span>
                <span className="font-bold">{new Date(client.lastVisit).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {client.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-semibold text-gray-500">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewingHistory(client)}
                className="flex-1 py-3 bg-white border-2 border-gray-50 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <History size={16} /> {t.crm.history}
              </button>
              <button
                onClick={() => setViewingLoyalty(client)}
                disabled={!loyaltyConfig.enabled}
                className={`flex-1 py-3 text-white rounded-2xl font-bold text-sm shadow-md transition-transform flex items-center justify-center gap-2 ${loyaltyConfig.enabled ? 'bg-[#C71585] shadow-purple-50 hover:scale-[1.02] active:scale-95' : 'bg-gray-300 cursor-not-allowed opacity-60'}`}
              >
                <Star size={16} /> {t.crm.loyalty}
              </button>
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-300 italic flex flex-col items-center gap-3">
            <Search size={48} className="opacity-20" />
            Nenhum cliente encontrado com os termos de busca...
          </div>
        )}
      </div>

      {/* Modal: Link Hub (Magnetic Link Settings) */}
      {activeMagicClient && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#40E0D0]/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#40E0D0] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Link2 size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Portal do Cliente 💎</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Link Magnético: {activeMagicClient.name.split(' ')[0]}</p>
                </div>
              </div>
              <button onClick={() => setActiveMagicClient(null)} className="p-2 bg-gray-50 rounded-full hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 overflow-hidden">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">ENDEREÇO DE ACESSO</label>
                <div className="bg-white p-4 rounded-xl border border-gray-100 text-[11px] font-mono text-[#40E0D0] break-all line-clamp-3 select-all font-bold">
                  {generatedMagicLink}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => copyToClipboard(generatedMagicLink)}
                  className="py-4 bg-[#40E0D0] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Copy size={16} /> Copiar Link
                </button>
                <a
                  href={generatedMagicLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> Abrir Portal
                </a>
              </div>

              <div className="bg-pink-50 p-5 rounded-2xl border border-pink-100 flex gap-4 items-start">
                <div className="p-2 bg-white rounded-lg text-[#FF69B4]"><Sparkles size={16} /></div>
                <p className="text-[11px] text-pink-800 font-medium leading-relaxed">
                  Envie este link no WhatsApp da cliente. Ela será identificada automaticamente e cairá direto no menu de agendamento do Studio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Cliente */}
      <Modal
        isOpen={isEditModalOpen && !!editingClient}
        onClose={() => { setIsEditModalOpen(false); setEditingClient(null); }}
        title="Editar Cliente 🌸"
        subtitle="Atualize os dados básicos"
        icon={<Edit3 size={24} />}
        iconBgColor="bg-[#40E0D0]"
      >
        {editingClient && (
          <div className="space-y-6">
            <InputField
              label="NOME COMPLETO"
              type="text"
              value={editingClient.name}
              onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
            />
            <InputField
              label="WHATSAPP / CELULAR"
              type="tel"
              value={editingClient.phone}
              onChange={e => setEditingClient({ ...editingClient, phone: formatPhoneNumber(e.target.value) })}
            />
            <InputField
              label="ANIVERSÁRIO"
              type="date"
              value={editingClient.birthDate || ''}
              onChange={e => setEditingClient({ ...editingClient, birthDate: e.target.value })}
              className="[color-scheme:light]"
            />
            <Button
              variant="success"
              size="lg"
              fullWidth
              icon={<Save size={20} />}
              onClick={handleSaveEdit}
            >
              Salvar Alterações ✨
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar Exclusão */}
      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 border border-white/20 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm mb-2">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">Remover Cliente?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Você está prestes a remover <span className="font-bold text-gray-800">{clientToDelete.name}</span>. Todo o histórico e pontos de fidelidade serão perdidos.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="danger"
                size="lg"
                fullWidth
                onClick={() => { onDelete(clientToDelete.id); setIsDeleteModalOpen(false); setClientToDelete(null); }}
              >
                Sim, Remover
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => { setIsDeleteModalOpen(false); setClientToDelete(null); }}
              >
                Não, Manter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t.crm.modalNewTitle}
        icon={<UserPlus size={24} />}
      >
        <div className="space-y-4">
          <InputField
            label={t.crm.clientName}
            type="text"
            autoFocus
            value={newClient.name}
            onChange={e => setNewClient({ ...newClient, name: e.target.value })}
          />
          <InputField
            label="WhatsApp (Celular)"
            type="tel"
            inputMode="numeric"
            placeholder="(31) 99999-9999"
            value={newClient.phone}
            onChange={e => setNewClient({ ...newClient, phone: formatPhoneNumber(e.target.value) })}
          />
          <InputField
            label="Aniversário (Opcional)"
            type="date"
            value={newClient.birthDate || ''}
            onChange={e => setNewClient({ ...newClient, birthDate: e.target.value })}
            className="[color-scheme:light]"
          />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAdd}
            className="mt-4"
          >
            {t.crm.registerBtn}
          </Button>
        </div>
      </Modal>

      {/* Modal: Histórico */}
      {viewingHistory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6 fade-in overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                  <History size={20} />
                </div>
                <h3 className="text-2xl font-bold">{t.crm.modalHistoryTitle}</h3>
              </div>
              <button onClick={() => setViewingHistory(null)} className="hover:rotate-90 transition-transform"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
              <p className="font-bold text-gray-400 uppercase text-[10px] tracking-widest ml-1">{viewingHistory.name}</p>
              {getClientHistory(viewingHistory.id).length > 0 ? getClientHistory(viewingHistory.id).map(apt => (
                <div key={apt.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-white transition-colors">
                  <div>
                    <span className="block font-bold text-gray-800">{apt.service}</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase font-black">
                      <Calendar size={10} /> {new Date(apt.date).toLocaleDateString()} • {apt.time}
                    </span>
                  </div>
                  <span className="font-black text-[#FF69B4]">R$ {apt.price}</span>
                </div>
              )) : (
                <div className="py-20 text-center text-gray-300 italic">
                  {t.crm.noAppointments}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Fidelidade */}
      {viewingLoyalty && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 fade-in text-center relative overflow-hidden transition-all duration-300">
            {isRedeemSuccess ? (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                <div className="w-32 h-32 bg-[#40E0D0] rounded-full flex items-center justify-center text-white shadow-2xl mb-6 animate-bounce">
                  <Gift size={64} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">Resgate Sucesso! 🎁</h3>
                <p className="text-gray-500 font-medium">O prêmio foi aplicado ao perfil de {viewingLoyalty.name}.</p>
              </div>
            ) : (
              <>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex justify-end relative">
                  <button onClick={closeLoyalty} className="hover:rotate-90 transition-transform"><X /></button>
                </div>

                <div className="space-y-4 relative">
                  <div className="w-20 h-20 bg-[#C71585]/10 rounded-3xl flex items-center justify-center text-[#C71585] mx-auto shadow-inner">
                    <Star size={40} />
                  </div>
                  <h3 className="text-2xl font-bold">{t.crm.modalLoyaltyTitle}</h3>
                  <p className="text-gray-400 font-medium">{viewingLoyalty.name}</p>
                </div>

                <div className="bg-[#F5F5F5] p-6 rounded-[2rem] border-2 border-dashed border-purple-100">
                  <span className="block text-4xl font-black text-[#C71585] mb-2">{viewingLoyalty.loyaltyPoints}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.crm.points}</span>
                </div>

                <div className="space-y-4">
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C71585] to-[#FF69B4] transition-all duration-1000"
                      style={{ width: `${Math.min(100, (viewingLoyalty.loyaltyPoints / loyaltyConfig.redemptionCost) * 100)}%` }}
                    />
                  </div>
                  {viewingLoyalty.loyaltyPoints < loyaltyConfig.redemptionCost ? (
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
                      Faltam {loyaltyConfig.redemptionCost - viewingLoyalty.loyaltyPoints} pontos para: <br />
                      <span className="text-[#C71585] not-italic text-sm">{loyaltyConfig.rewardName}</span> 💎
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-emerald-500 animate-pulse uppercase tracking-widest">
                      Prêmio Disponível: {loyaltyConfig.rewardName} 🎉
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRedeem}
                  disabled={viewingLoyalty.loyaltyPoints < loyaltyConfig.redemptionCost}
                  className="w-full py-5 bg-[#C71585] text-white rounded-2xl font-bold shadow-xl shadow-purple-100 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                >
                  <Sparkles size={20} /> {t.crm.redeem}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;
