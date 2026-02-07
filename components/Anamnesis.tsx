import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList,
    Settings2,
    Fingerprint,
    Share2,
    FileText,
    Plus,
    Trash2,
    Move,
    ChevronRight,
    ChevronLeft,
    Save,
    Download,
    CheckCircle2,
    X,
    Type,
    Hash,
    ToggleLeft,
    List,
    AlignLeft,
    Info,
    Smartphone,
    Tablet,
    Printer,
    FileDown,
    Sparkles,
    Cloud,
    Search,
    Eye,
    Users,
    Check,
    ArrowRight,
    Wand2,
    Droplet,
    Heart
} from 'lucide-react';
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import {
    AnamnesisTemplate,
    AnamnesisField,
    AnamnesisRecord,
    AnamnesisFieldType,
    Client,
    ConfirmDialogOptions
} from '../types';

interface AnamnesisProps {
    clients: Client[];
    templates: AnamnesisTemplate[];
    records: AnamnesisRecord[];
    onAddTemplate: (template: AnamnesisTemplate) => void;
    onUpdateTemplate: (template: AnamnesisTemplate) => void;
    onDeleteTemplate: (id: string) => void;
    onAddRecord: (record: AnamnesisRecord) => void;
    onDeleteRecord: (id: string) => void;
    onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onShowConfirm: (options: { title: string; message: string; onConfirm: () => void; variant?: 'primary' | 'danger' | 'success' }) => void;
}

const LUX_QUICK_TEMPLATES: Partial<AnamnesisTemplate>[] = [
    {
        title: 'Ficha Editorial: Extensão de Cílios',
        category: 'Lash Design',
        description: 'Protocolo de luxo para análise de saúde ocular, estilo e retenção.',
        fields: [
            { id: 'h1', label: 'Identificação Profissional', type: 'heading', required: false, description: 'Análise de retenção e histórico técnico.' },
            { id: 'prof_name', label: 'Nome da Lash Designer', type: 'text', required: true, placeholder: 'Ex: Dra. Juliana Silva' },
            { id: 'h2', label: 'Checklist de Saúde (Obrigatório)', type: 'heading', required: false, description: 'Segurança médica e estética' },
            { id: 'allergy_latex', label: 'Alergia a Látex ou Cianoacrilato?', type: 'boolean', required: true, description: 'Fundamental para escolha do adesivo.' },
            { id: 'eye_health', label: 'Histórico de cirurgias oculares ou Blefarite?', type: 'boolean', required: true },
            { id: 'systemic', label: 'Condições sistêmicas (Tireoide ou Diabetes)?', type: 'boolean', required: true, description: 'Afeta diretamente a retenção dos fios.' },
            { id: 'pregnant', label: 'Estado Gestacional ou Psicológico Sensível?', type: 'boolean', required: true },
            { id: 'h3', label: 'Lifestyle & Retenção', type: 'heading', required: false, description: 'Hábitos que influenciam o resultado.' },
            { id: 'sleep_habit', label: 'Costuma dormir de lado ou bruços?', type: 'boolean', required: true },
            { id: 'exercise', label: 'Pratica exercícios físicos intensos ou natação?', type: 'boolean', required: true },
            { id: 'skincare', label: 'Utiliza demaquilantes ou cremes à base de óleo?', type: 'boolean', required: true },
            { id: 'h4', label: 'Prontuário Técnico (Lash Design)', type: 'heading', required: false, description: 'Personalização e Mapping' },
            { id: 'mapping', label: 'Mapping Escolhido', type: 'select', required: true, options: ['Boneca (Doll)', 'Esquilo (Squirrel)', 'Gatinho (Cat Eye)', 'Natural'] },
            { id: 'curvature', label: 'Curvatura Utilizada', type: 'select', required: true, options: ['C', 'CC', 'D', 'L'] },
            { id: 'thickness', label: 'Espessura dos Fios', type: 'select', required: true, options: ['0.03', '0.05', '0.07', '0.15'] },
            { id: 'adhesive', label: 'Adesivo/Cola Utilizada', type: 'text', required: true, placeholder: 'Ex: Elite HS-10' },
            { id: 'environment', label: 'Umidade e Temperatura da Cabine', type: 'text', required: false, placeholder: 'Ex: 55% / 22°C' },
            { id: 'h5', label: 'Segurança & Termos', type: 'heading', required: false, description: 'Cláusulas de Veracidade e Imagem' },
            { id: 'term_veracity', label: 'Confirmo a veracidade de todas as informações prestadas.', type: 'boolean', required: true },
            { id: 'term_image', label: 'Autorizo o uso de imagem (fotos/vídeos) para fins de portfólio profissional.', type: 'boolean', required: true },
        ]
    }
];

const AnamnesisView: React.FC<AnamnesisProps> = ({
    clients,
    templates,
    records,
    onAddTemplate,
    onUpdateTemplate,
    onDeleteTemplate,
    onAddRecord,
    onDeleteRecord,
    onShowToast,
    onShowConfirm
}) => {
    const [activeTab, setActiveTab] = useState<'manager' | 'builder' | 'player'>('manager');
    const [editingTemplate, setEditingTemplate] = useState<AnamnesisTemplate | null>(null);
    const [playerTemplate, setPlayerTemplate] = useState<AnamnesisTemplate | null>(null);
    const [playingRecord, setPlayingRecord] = useState<Partial<AnamnesisRecord>>({});
    const [step, setStep] = useState(0);

    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@400;600;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link); };
    }, []);

    const handleCreateFromLux = (base: Partial<AnamnesisTemplate>) => {
        const t: AnamnesisTemplate = {
            id: Date.now().toString(),
            title: base.title || 'Novo Protocolo',
            description: base.description || '',
            category: base.category || 'Geral',
            fields: base.fields || [],
            updatedAt: new Date().toISOString()
        };
        onAddTemplate(t);
        setEditingTemplate(t);
        setActiveTab('builder');
        onShowToast('Template de luxo gerada com sucesso!', 'success');
    };

    const handleStartNewTemplate = () => {
        const newT: AnamnesisTemplate = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Novo Modelo',
            description: 'Descreva o propósito desta ficha',
            category: 'Geral',
            fields: [],
            updatedAt: new Date().toISOString()
        };
        setEditingTemplate(newT);
        setActiveTab('builder');
    };

    const handleStartPlayer = (template: AnamnesisTemplate) => {
        setPlayerTemplate(template);
        setPlayingRecord({
            templateId: template.id,
            answers: {},
            createdAt: new Date().toISOString()
        });
        setStep(0);
        setActiveTab('player');
    };

    const handleSaveRecord = (signature: string) => {
        if (!playerTemplate || !playingRecord.clientId) {
            onShowToast('Erro ao salvar: Dados incompletos.', 'error');
            return;
        }

        const fullRecord: AnamnesisRecord = {
            id: Math.random().toString(36).substr(2, 9),
            templateId: playerTemplate.id,
            clientId: playingRecord.clientId,
            clientName: playingRecord.clientName || '',
            answers: playingRecord.answers || {},
            signatureUrl: signature,
            signedAt: new Date().toISOString(),
            createdAt: playingRecord.createdAt || new Date().toISOString()
        };

        onAddRecord(fullRecord);
        onShowToast('Ficha de Anamnese salva com sucesso!', 'success');
        setActiveTab('manager');
        setPlayingRecord({});
        setPlayerTemplate(null);
    };

    const exportRecordToPDF = async (record: AnamnesisRecord, template: AnamnesisTemplate) => {
        const doc = new jsPDF();
        const margin = 20;
        let y = 20;

        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229);
        doc.text("FICHA DE ANAMNESE", margin, y);
        y += 15;

        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.text(`CLIENTE: ${record.clientName}`, margin, y);
        y += 10;
        doc.text(`DATA: ${new Date(record.createdAt).toLocaleDateString()}`, margin, y);
        y += 20;

        template.fields.forEach(field => {
            if (field.type === 'heading') {
                y += 5;
                doc.setFontSize(14);
                doc.setTextColor(79, 70, 229);
                doc.text(field.label.toUpperCase(), margin, y);
                y += 10;
                return;
            }

            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text(field.label, margin, y);
            y += 6;

            doc.setFontSize(11);
            doc.setTextColor(31, 41, 55);
            const answer = record.answers[field.id];
            const answerText = typeof answer === 'boolean' ? (answer ? 'SIM' : 'NÃO') : (answer || 'N/A');
            doc.text(String(answerText), margin, y);
            y += 12;

            if (y > 270) { doc.addPage(); y = 20; }
        });

        if (record.signatureUrl) {
            y += 10;
            doc.addImage(record.signatureUrl, 'PNG', margin, y, 60, 25);
        }

        doc.save(`Anamnese_${record.clientName.replace(/\s/g, '_')}.pdf`);
        onShowToast('PDF gerado com sucesso!', 'info');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Anamnese Digital ✨</h2>
                        <p className="text-gray-500 font-medium text-sm">Escaneamento técnico e histórico inteligente.</p>
                    </div>
                </div>

                {activeTab === 'manager' && (
                    <div className="flex items-center gap-3">
                        <button onClick={handleStartNewTemplate} className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
                            <Plus size={18} /> Novo Modelo
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'manager' && (
                    <TemplateManager
                        key="manager"
                        templates={templates}
                        records={records}
                        onStartPlayer={handleStartPlayer}
                        onEditTemplate={(t) => { setEditingTemplate(t); setActiveTab('builder'); }}
                        onDeleteTemplate={onDeleteTemplate}
                        onAddQuickTemplate={handleCreateFromLux}
                        onExportPDF={exportRecordToPDF}
                        onDeleteRecord={onDeleteRecord}
                        onShowConfirm={onShowConfirm}
                    />
                )}

                {activeTab === 'builder' && editingTemplate && (
                    <TemplateBuilder
                        key="builder"
                        template={editingTemplate}
                        onChange={setEditingTemplate}
                        onSave={() => {
                            const exists = templates.find(t => t.id === editingTemplate.id);
                            if (exists) onUpdateTemplate(editingTemplate);
                            else onAddTemplate(editingTemplate);
                            onShowToast('Modelo salvo!', 'success');
                            setActiveTab('manager');
                        }}
                        onCancel={() => setActiveTab('manager')}
                    />
                )}

                {activeTab === 'player' && playerTemplate && (
                    <FormPlayer
                        key="player"
                        template={playerTemplate}
                        clients={clients}
                        onSave={handleSaveRecord}
                        onCancel={() => setActiveTab('manager')}
                        playingRecord={playingRecord}
                        onUpdateRecord={setPlayingRecord}
                        step={step}
                        setStep={setStep}
                        onPrevStep={() => setStep(s => Math.max(0, s - 1))}
                        onShowToast={onShowToast}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

/* --- SUBCOMPONENTS --- */

const TemplateManager: React.FC<{
    templates: AnamnesisTemplate[];
    records: AnamnesisRecord[];
    onStartPlayer: (t: AnamnesisTemplate) => void;
    onEditTemplate: (t: AnamnesisTemplate) => void;
    onDeleteTemplate: (id: string) => void;
    onAddQuickTemplate: (t: Partial<AnamnesisTemplate>) => void;
    onExportPDF: (r: AnamnesisRecord, t: AnamnesisTemplate) => void;
    onDeleteRecord: (id: string) => void;
    onShowConfirm: (options: ConfirmDialogOptions) => void;
}> = ({ templates, records, onStartPlayer, onEditTemplate, onDeleteTemplate, onAddQuickTemplate, onExportPDF, onDeleteRecord, onShowConfirm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingRecord, setViewingRecord] = useState<{ record: AnamnesisRecord, template: AnamnesisTemplate } | null>(null);

    const filteredRecords = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return records.filter(r => r.clientName.toLowerCase().includes(lower))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [records, searchTerm]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-600" /> Modelos Rápidos
                    </h3>
                    <div className="space-y-3">
                        {LUX_QUICK_TEMPLATES.map((qt, i) => (
                            <button
                                key={i}
                                onClick={() => onAddQuickTemplate(qt)}
                                className="w-full p-6 rounded-[2rem] border-2 border-gray-100 hover:border-[#FF69B4] hover:shadow-xl transition-all text-left group"
                            >
                                <p className="font-serif text-lg text-gray-900 group-hover:text-[#FF69B4] transition-colors">{qt.title}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{qt.category}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-black text-gray-700 text-xs uppercase tracking-[0.2em] px-4">Meus Modelos</h3>
                    {templates.map(t => (
                        <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
                            <div className="flex-1 cursor-pointer" onClick={() => onStartPlayer(t)}>
                                <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-wider">{t.title}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.category}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onEditTemplate(t)} className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"><Settings2 size={16} /></button>
                                <button onClick={() => onShowConfirm({
                                    title: 'Excluir Modelo?',
                                    message: 'Esta ação não afetará fichas já preenchidas.',
                                    variant: 'danger',
                                    onConfirm: () => onDeleteTemplate(t.id)
                                })} className="p-2 text-gray-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="md:col-span-2 space-y-6">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou procedimento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-none rounded-[2rem] py-6 pl-16 pr-6 text-sm font-bold shadow-sm focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-200"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredRecords.map(r => {
                        const template = templates.find(t => t.id === r.templateId);
                        return (
                            <div key={r.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {r.clientName[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-serif text-xl text-gray-900">{r.clientName}</h4>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{template?.title || 'Ficha Excluída'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setViewingRecord({ record: r, template: template! })} className="p-4 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-2xl transition-all"><Eye size={18} /></button>
                                    <button onClick={() => onExportPDF(r, template!)} className="p-4 bg-gray-50 text-gray-400 hover:text-[#FF69B4] rounded-2xl transition-all"><FileDown size={18} /></button>
                                    <button onClick={() => onDeleteRecord(r.id)} className="p-4 bg-gray-50 text-gray-400 hover:text-rose-500 rounded-2xl transition-all"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {viewingRecord && (
                <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-10 border-b border-gray-50 shrink-0">
                            <h3 className="font-serif text-3xl text-gray-900">{viewingRecord.record.clientName}</h3>
                            <p className="text-[10px] font-black text-[#FF69B4] uppercase tracking-[0.3em] mt-2">Prontuário Digital: {viewingRecord.template.title}</p>
                        </div>
                        <div className="p-10 overflow-y-auto space-y-8 flex-1 scrollbar-hide">
                            {viewingRecord.template.fields.map(f => {
                                if (f.type === 'heading') return <h4 key={f.id} className="font-serif text-2xl text-gray-900 pt-6 border-t border-gray-50">{f.label}</h4>;
                                const ans = viewingRecord.record.answers[f.id];
                                return (
                                    <div key={f.id} className="space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f.label}</p>
                                        <p className="text-lg font-serif text-gray-700">{typeof ans === 'boolean' ? (ans ? 'Sim' : 'Não') : (ans || 'N/A')}</p>
                                    </div>
                                );
                            })}
                            {viewingRecord.record.signatureUrl && (
                                <div className="pt-10 border-t border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Assinatura Certificada</p>
                                    <img src={viewingRecord.record.signatureUrl} alt="Signature" className="max-w-[200px] border border-gray-100 rounded-2xl" />
                                </div>
                            )}
                        </div>
                        <div className="p-10 bg-gray-50 flex gap-4 shrink-0">
                            <button onClick={() => setViewingRecord(null)} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Fechar Prontuário</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TemplateBuilder: React.FC<{
    template: AnamnesisTemplate;
    onChange: (t: AnamnesisTemplate) => void;
    onSave: () => void;
    onCancel: () => void;
}> = ({ template, onChange, onSave, onCancel }) => {
    const updateField = (id: string, updates: Partial<AnamnesisField>) => {
        onChange({ ...template, fields: template.fields.map(f => f.id === id ? { ...f, ...updates } : f) });
    };

    const addField = (type: AnamnesisFieldType) => {
        const newField: AnamnesisField = {
            id: Math.random().toString(36).substr(2, 9),
            label: type === 'heading' ? 'Novo Título' : 'Nova Pergunta',
            type,
            required: false,
            options: type === 'select' ? ['Opção 1', 'Opção 2'] : undefined
        };
        onChange({ ...template, fields: [...template.fields, newField] });
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...template.fields];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newFields.length) return;
        [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
        onChange({ ...template, fields: newFields });
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden max-w-4xl mx-auto">
            <div className="p-10 bg-gray-50 border-white flex justify-between items-center">
                <div>
                    <input
                        value={template.title}
                        onChange={e => onChange({ ...template, title: e.target.value })}
                        className="bg-transparent border-none text-3xl font-black text-gray-900 p-0 mb-1 outline-none w-full"
                    />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Configuração de Protocolo Profissional</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="px-6 py-4 text-gray-400 font-black text-[10px] uppercase">Cancelar</button>
                    <button onClick={onSave} className="bg-gray-900 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl">Salvar Modelo</button>
                </div>
            </div>

            <div className="grid grid-cols-4 min-h-[500px]">
                <div className="col-span-1 bg-gray-50 p-6 border-r border-gray-100 space-y-4">
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Ferramentas</h5>
                    {[
                        { icon: <Type size={16} />, label: 'Texto', type: 'text' },
                        { icon: <AlignLeft size={16} />, label: 'Parágrafo', type: 'textarea' },
                        { icon: <ToggleLeft size={16} />, label: 'Booleano', type: 'boolean' },
                        { icon: <List size={16} />, label: 'Seleção', type: 'select' },
                        { icon: <Info size={16} />, label: 'Título', type: 'heading' }
                    ].map(item => (
                        <button key={item.label} onClick={() => addField(item.type as AnamnesisFieldType)} className="w-full p-4 bg-white rounded-2xl border border-transparent shadow-sm hover:border-indigo-200 flex items-center gap-4 group">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white">{item.icon}</div>
                            <span className="text-xs font-bold text-gray-600">{item.label}</span>
                        </button>
                    ))}

                    <div className="pt-6 border-t border-gray-200">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Categoria</label>
                        <select value={template.category} onChange={e => onChange({ ...template, category: e.target.value })} className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold text-gray-700">
                            {['Cílios', 'Sobrancelha', 'Estética', 'Unhas', 'Geral'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="col-span-3 p-10 space-y-8 overflow-y-auto scrollbar-hide max-h-[600px]">
                    {template.fields.map((field, idx) => (
                        <div key={field.id} className="group relative bg-white p-6 rounded-3xl border border-gray-100 hover:border-[#FF69B4] transition-all shadow-sm">
                            <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => moveField(idx, 'up')} className="p-1 bg-white border rounded shadow-sm hover:text-indigo-600"><ChevronLeft size={12} className="rotate-90" /></button>
                                <button onClick={() => moveField(idx, 'down')} className="p-1 bg-white border rounded shadow-sm hover:text-indigo-600"><ChevronLeft size={12} className="-rotate-90" /></button>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 space-y-3">
                                    <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} className="w-full font-bold text-gray-800 text-lg border-none p-0 focus:ring-0 outline-none" />
                                    {field.type === 'select' && (
                                        <input value={field.options?.join(', ')} onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold" placeholder="Opções (sep. por vírgula)" />
                                    )}
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="w-4 h-4 rounded text-indigo-600" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Obrigatório</span>
                                        </label>
                                        <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-3 py-1 rounded-full uppercase">{field.type}</span>
                                    </div>
                                </div>
                                <button onClick={() => onChange({ ...template, fields: template.fields.filter(f => f.id !== field.id) })} className="p-2 text-gray-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const FormPlayer: React.FC<{
    template: AnamnesisTemplate;
    clients: Client[];
    onSave: (sig: string) => void;
    onCancel: () => void;
    playingRecord: Partial<AnamnesisRecord>;
    onUpdateRecord: (r: Partial<AnamnesisRecord>) => void;
    step: number;
    setStep: (s: number) => void;
    onPrevStep: () => void;
    onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ template, clients, onSave, onCancel, playingRecord, onUpdateRecord, step, setStep, onPrevStep, onShowToast }) => {
    const sigCanvas = useRef<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAftercare, setShowAftercare] = useState(false);

    const isClientStep = step === 0;
    const totalSteps = template.fields.length + 1;
    const currentField = !isClientStep && step <= template.fields.length ? template.fields[step - 1] : null;
    const isSignatureStep = step === totalSteps;

    const filteredClients = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return clients.filter(c => c.name.toLowerCase().includes(lower) || c.phone.toLowerCase().includes(lower));
    }, [clients, searchTerm]);

    const setAnswer = (fieldId: string, value: any) => {
        onUpdateRecord({ ...playingRecord, answers: { ...(playingRecord.answers || {}), [fieldId]: value } });
    };

    const handleNext = () => {
        if (isClientStep && !playingRecord.clientId) {
            onShowToast('Selecione uma cliente para continuar.', 'error');
            return;
        }
        if (currentField && currentField.required && !playingRecord.answers?.[currentField.id]) {
            onShowToast('Este campo é obrigatório.', 'error');
            return;
        }
        setStep(step + 1);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] bg-white flex flex-col font-sans">
            <header className="px-8 md:px-20 py-8 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white"><Sparkles size={24} /></div>
                    <div>
                        <h2 className="font-serif text-2xl text-gray-900">{template.title}</h2>
                        <p className="text-[10px] font-black uppercase text-[#FF69B4] tracking-[0.3em]">BellaAI Luxury Experience</p>
                    </div>
                </div>
                <button onClick={onCancel} className="p-4 bg-gray-50 text-gray-400 hover:text-rose-500 rounded-2xl transition-all"><X size={20} /></button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                <div className="w-full md:w-80 bg-gray-50/50 p-8 md:p-12 space-y-12 overflow-y-auto border-r border-gray-100">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Fases do Protocolo</p>
                        <div className="space-y-3">
                            {[{ label: 'Identificação', s: 0 }, ...template.fields.map((f, i) => ({ label: f.label, s: i + 1 })), { label: 'Finalização', s: totalSteps }].map((sObj, i) => {
                                const isActive = step === sObj.s;
                                const isDone = step > sObj.s;
                                return (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-400' : isActive ? 'bg-[#FF69B4] scale-150' : 'bg-gray-200'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>{sObj.label.slice(0, 20)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {playingRecord.clientId && (
                        <div className="pt-12 border-t border-gray-100">
                            <p className="text-sm font-bold text-gray-900">{playingRecord.clientName}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-black">Cliente Selecionada</p>
                        </div>
                    )}
                </div>

                <main className="flex-1 bg-white flex flex-col items-center justify-center p-8 md:p-20 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-2xl text-center space-y-12">
                            {isClientStep && (
                                <div className="space-y-10">
                                    <h3 className="font-serif text-5xl text-gray-900">Seja bem-vinda.</h3>
                                    <div className="relative max-w-md mx-auto">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                        <input type="text" placeholder="Nome da cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border-none rounded-3xl py-6 pl-16 pr-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-pink-50 transition-all" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                                        {filteredClients.map(c => (
                                            <button key={c.id} onClick={() => { onUpdateRecord({ ...playingRecord, clientId: c.id, clientName: c.name }); setStep(1); }} className="p-6 rounded-[2rem] border-2 border-transparent bg-gray-50/50 hover:border-[#FF69B4] hover:bg-white hover:shadow-xl transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#FF69B4] font-black">{c.name[0]}</div>
                                                    <div className="text-left"><p className="font-serif text-lg text-gray-900 leading-none">{c.name}</p></div>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#FF69B4]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentField && (
                                <div className="space-y-12">
                                    <h3 className="font-serif text-5xl text-gray-900 leading-tight">{currentField.label}</h3>
                                    {currentField.type === 'heading' ? (
                                        <button onClick={handleNext} className="bg-gray-900 text-white px-12 py-6 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.05] transition-all">Iniciar Seção <ChevronRight className="inline ml-2" size={18} /></button>
                                    ) : (
                                        <div className="w-full">
                                            {currentField.type === 'text' && <input autoFocus value={playingRecord.answers?.[currentField.id] || ''} onChange={e => setAnswer(currentField.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNext()} className="w-full bg-transparent border-b-2 border-gray-100 py-6 text-center text-4xl font-serif text-[#FF69B4] outline-none focus:border-[#FF69B4] transition-all" placeholder="Escreva aqui..." />}
                                            {currentField.type === 'textarea' && <textarea autoFocus value={playingRecord.answers?.[currentField.id] || ''} onChange={e => setAnswer(currentField.id, e.target.value)} className="w-full bg-gray-50 rounded-[3rem] p-12 text-2xl font-serif text-center outline-none focus:ring-4 focus:ring-pink-50 min-h-[250px]" placeholder="Sua resposta..." />}
                                            {currentField.type === 'boolean' && (
                                                <div className="grid grid-cols-2 gap-8 max-w-xl mx-auto">
                                                    <button onClick={() => { setAnswer(currentField.id, true); handleNext(); }} className={`p-12 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-4 ${playingRecord.answers?.[currentField.id] === true ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-transparent text-gray-400 hover:border-[#FF69B4]'}`}><Check size={40} /><span className="font-serif text-3xl">Sim</span></button>
                                                    <button onClick={() => { setAnswer(currentField.id, false); handleNext(); }} className={`p-12 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-4 ${playingRecord.answers?.[currentField.id] === false ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-transparent text-gray-400 hover:border-[#FF69B4]'}`}><X size={40} /><span className="font-serif text-3xl">Não</span></button>
                                                </div>
                                            )}
                                            {currentField.type === 'select' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {currentField.options?.map(opt => (
                                                        <button key={opt} onClick={() => { setAnswer(currentField.id, opt); handleNext(); }} className={`p-8 rounded-[2rem] border-2 transition-all font-serif text-2xl ${playingRecord.answers?.[currentField.id] === opt ? 'bg-gray-900 text-white' : 'bg-gray-50 border-transparent text-gray-600 hover:border-[#FF69B4]'}`}>{opt}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {isSignatureStep && (
                                <div className="space-y-12">
                                    <h3 className="font-serif text-5xl text-gray-900">Validar Prontuário</h3>
                                    <div className="bg-gray-50 rounded-[4rem] p-10 border-2 border-dashed border-gray-200 relative overflow-hidden group">
                                        <SignatureCanvas ref={sigCanvas} penColor='#111827' canvasProps={{ className: 'w-full h-80' }} />
                                        <button onClick={() => sigCanvas.current?.clear()} className="absolute bottom-10 left-12 text-[10px] font-black uppercase text-gray-400 hover:text-rose-500 transition-colors">Limpar Assinatura</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-auto w-full flex items-center justify-between max-w-4xl py-10">
                        {!isClientStep && <button onClick={onPrevStep} className="flex items-center gap-2 text-gray-300 font-black uppercase text-[10px] hover:text-gray-900 transition-all"><ChevronLeft size={20} /> Voltar</button>}
                        <div className="flex-1" />
                        {!isSignatureStep && !isClientStep && <button onClick={handleNext} className="bg-gray-900 text-white px-12 py-6 rounded-full font-black text-xs uppercase tracking-widest hover:scale-[1.05] transition-all">Próximo <ChevronRight className="inline ml-2" size={18} /></button>}
                        {isSignatureStep && <button onClick={() => { if (!sigCanvas.current?.isEmpty()) setShowAftercare(true); else onShowToast('Assinatura obrigatória!', 'error'); }} className="bg-indigo-600 text-white px-14 py-7 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.05] transition-all">Finalizar e Validar <CheckCircle2 className="inline ml-2" size={24} /></button>}
                    </div>
                </main>
            </div>

            {showAftercare && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
                    <div className="absolute inset-0" onClick={() => setShowAftercare(false)}></div>
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl space-y-8 relative max-w-sm">
                        <div className="text-center space-y-2">
                            <Sparkles size={48} className="mx-auto text-[#FF69B4] mb-2" />
                            <h4 className="text-3xl font-serif text-gray-900">Guia de Cuidados</h4>
                            <p className="text-[10px] font-black uppercase text-[#FF69B4] tracking-[0.3em]">BellaAI Luxury Aftercare</p>
                        </div>

                        <div className="space-y-4 pt-4">
                            {[
                                { t: '24 Horas', d: 'Evite vapor, água quente e umidade excessiva.' },
                                { t: 'Higienização', d: 'Lave diariamente com mousse específico.' },
                                { t: 'Manutenção', d: 'Penteie os fios suavemente pela manhã.' },
                                { t: 'Preservação', d: 'Não utilize rímel ou produtos oleosos.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-lg bg-pink-50 text-[#FF69B4] flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</div>
                                    <div>
                                        <p className="text-xs font-black text-gray-800 uppercase tracking-tighter">{item.t}</p>
                                        <p className="text-[11px] text-gray-400 font-medium leading-tight">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => {
                            if (sigCanvas.current) {
                                onSave(sigCanvas.current.toDataURL());
                            }
                        }} className="w-full py-6 bg-gray-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all">
                            Finalizar Experiência
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AnamnesisView;
