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
    Professional,
    ConfirmDialogOptions
} from '../types';

interface AnamnesisProps {
    clients: Client[];
    staff: Professional[];
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
        title: 'Anamnese Extensão de Cílios',
        category: 'Lash Design',
        description: 'Protocolo de luxo para análise de saúde ocular, estilo e retenção.',
        fields: [
            { id: 'h1', label: 'Avaliação de Saúde & Contraindicações', type: 'heading', required: false, description: 'Protocolo preventivo para sua segurança ocular.' },
            { id: 'lash_designer', label: 'Nome da Lash Designer', type: 'staff', required: true },
            { id: 'sensibilidade', label: 'Sua pele costuma reagir a materiais de uso tópico, cosméticos ou adesivos?', type: 'boolean', required: true },
            { id: 'lentes', label: 'Você utiliza lentes de contato ou possui olhos excessivamente secos?', type: 'boolean', required: true },
            { id: 'condicao_olhos', label: 'Já teve alguma condição relacionada aos olhos ou cílios (ex: blefarite, conjuntivite)?', type: 'boolean', required: true },
            { id: 'procedimento_recente', label: 'Realizou procedimento facial ou ocular nos últimos 6 meses (Botox, Micro, Cirurgia)?', type: 'boolean', required: true },
            { id: 'saude_fios', label: 'Há alguma condição de saúde ou hormonal que possa afetar o crescimento dos fios?', type: 'boolean', required: true },
            { id: 'condicao_fisica', label: 'Há alguma condição física atual (Gestação, Sensibilidade na Coluna ou Lombo)?', type: 'boolean', required: true },
            { id: 'medicacao', label: 'Está utilizando alguma medicação que possa interferir no procedimento ou sensibilidade?', type: 'boolean', required: true },

            { id: 'h2', label: 'Histórico & Hábitos Relevantes', type: 'heading', required: false, description: 'Entendendo seu lifestyle para maximizar a retenção.' },
            { id: 'primeira_vez', label: 'Já realizou este procedimento anteriormente? Teve alguma intercorrência?', type: 'boolean', required: true },
            { id: 'limpeza_facial', label: 'Quais produtos de limpeza facial você prefere utilizar na área dos olhos?', type: 'select', required: true, options: ['Mousse/Sabonete Neutro', 'Água Micelar', 'Demaquilante (Base Óleo)', 'Nenhum / Somente Água'] },
            { id: 'dormir', label: 'Qual a sua posição preferencial ao dormir? (Isso influencia na durabilidade)', type: 'select', required: true, options: ['De Costas', 'Lado Esquerdo', 'Lado Direito', 'De Bruços'] },
            { id: 'atividades', label: 'Pratica atividades intensas com umidade ou atrito (Academia, Natação, Sauna)?', type: 'boolean', required: true },

            { id: 'h3', label: 'Prontuário Técnico (Mapping)', type: 'heading', required: false, description: 'Personalização artística e design.' },
            { id: 'mapping', label: 'Mapping Escolhido', type: 'select', required: true, options: ['Gatinho (Cat Eye)', 'Boneca (Doll)', 'Esquilo (Squirrel)', 'Fox Eye', 'Natural'] },
            { id: 'curvatura', label: 'Curvatura Utilizada', type: 'select', required: true, options: ['J e B', 'C', 'CC / D', 'L e M'] },
            { id: 'thickness', label: 'Espessura dos Fios', type: 'select', required: true, options: ['Volume Russo e Mega Volume (0.03mm a 0.07mm)', 'Híbrido ou Volume Suave (0.10mm a 0.12mm)', 'Fio a Fio / Clássico (0.15mm a 0.20mm)', 'Não Recomendados (0.25mm ou mais)'] },

            { id: 'h4', label: 'Termos & Consentimento', type: 'heading', required: false },
            { id: 'term_image', label: 'Autorizo o uso de imagem para portfólio profissional e redes sociais.', type: 'boolean', required: true },
        ]
    }
];

const AnamnesisView: React.FC<AnamnesisProps> = ({
    clients,
    staff,
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
                        onShowToast={onShowToast}
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
                        onShowConfirm={onShowConfirm}
                    />
                )}

                {activeTab === 'player' && playerTemplate && (
                    <FormPlayer
                        key="player"
                        template={playerTemplate}
                        clients={clients}
                        staff={staff}
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
    onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ templates, records, onStartPlayer, onEditTemplate, onDeleteTemplate, onAddQuickTemplate, onExportPDF, onDeleteRecord, onShowConfirm, onShowToast }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingRecord, setViewingRecord] = useState<{ record: AnamnesisRecord, template: AnamnesisTemplate } | null>(null);

    const filteredRecords = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return records.filter(r => {
            const hasTemplate = templates.some(t => t.id === r.templateId);
            return hasTemplate && r.clientName.toLowerCase().includes(lower);
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [records, templates, searchTerm]);

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
                            <div key={r.id} className="bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:shadow-lg transition-all">
                                <div className="flex items-center gap-4 md:gap-5 min-w-0">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                                        {r.clientName[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-serif text-lg md:text-xl text-gray-900 truncate">{r.clientName}</h4>
                                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{template?.title || 'Ficha Excluída'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        onClick={() => {
                                            if (template) setViewingRecord({ record: r, template });
                                            else onShowToast('Este prontuário não pode ser aberto pois o modelo foi excluído.', 'error');
                                        }}
                                        className="p-3 md:p-4 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl md:rounded-2xl transition-all"
                                    >
                                        <Eye className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (template) onExportPDF(r, template);
                                            else onShowToast('Exportação impossível: Modelo original não encontrado.', 'error');
                                        }}
                                        className="p-3 md:p-4 bg-gray-50 text-gray-400 hover:text-[#FF69B4] rounded-xl md:rounded-2xl transition-all"
                                    >
                                        <FileDown className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    <button onClick={() => onShowConfirm({
                                        title: 'Excluir Prontuário?',
                                        message: 'Esta ação não poderá ser desfeita. Deseja realmente remover este registro?',
                                        variant: 'danger',
                                        onConfirm: () => onDeleteRecord(r.id)
                                    })} className="p-3 md:p-4 bg-gray-50 text-gray-400 hover:text-rose-500 rounded-xl md:rounded-2xl transition-all"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {viewingRecord && (
                <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                        <div className="p-6 md:p-10 border-b border-gray-50 shrink-0">
                            <h3 className="font-serif text-2xl md:text-3xl text-gray-900">{viewingRecord.record.clientName}</h3>
                            <p className="text-[10px] font-black text-[#FF69B4] uppercase tracking-[0.3em] mt-2">Prontuário Digital: {viewingRecord.template.title}</p>
                        </div>
                        <div className="p-6 md:p-10 overflow-y-auto space-y-6 md:space-y-8 flex-1 scrollbar-hide">
                            {viewingRecord.template.fields.map(f => {
                                if (f.type === 'heading') return <h4 key={f.id} className="font-serif text-xl md:text-2xl text-gray-900 pt-6 border-t border-gray-50">{f.label}</h4>;
                                const ans = viewingRecord.record.answers[f.id];
                                return (
                                    <div key={f.id} className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f.label}</p>
                                        <p className="text-base md:text-lg font-serif text-gray-700">{typeof ans === 'boolean' ? (ans ? 'Sim' : 'Não') : (ans || 'N/A')}</p>
                                    </div>
                                );
                            })}
                            {viewingRecord.record.signatureUrl && (
                                <div className="pt-8 md:pt-10 border-t border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Assinatura Certificada</p>
                                    <img src={viewingRecord.record.signatureUrl} alt="Signature" className="max-w-[150px] md:max-w-[200px] border border-gray-100 rounded-2xl" />
                                </div>
                            )}
                        </div>
                        <div className="p-6 md:p-10 bg-gray-50 flex gap-4 shrink-0">
                            <button onClick={() => setViewingRecord(null)} className="flex-1 py-4 bg-gray-900 text-white rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-widest">Fechar Prontuário</button>
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
    onShowConfirm: (options: ConfirmDialogOptions) => void;
}> = ({ template, onChange, onSave, onCancel, onShowConfirm }) => {
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
            <div className="p-6 md:p-10 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex-1 min-w-0 w-full">
                    <input
                        value={template.title}
                        onChange={e => onChange({ ...template, title: e.target.value })}
                        className="bg-transparent border-none text-2xl md:text-3xl font-black text-gray-900 p-0 mb-1 outline-none w-full truncate focus:not-italic"
                        placeholder="Título do Modelo"
                    />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Configuração de Protocolo Profissional</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <button onClick={onCancel} className="flex-1 sm:flex-none px-4 py-3 text-gray-400 hover:text-gray-600 font-black text-[10px] uppercase transition-colors">Cancelar</button>
                    <button onClick={onSave} className="flex-1 sm:flex-none bg-gray-900 text-white px-6 py-3 rounded-2xl md:rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Salvar Modelo</button>
                </div>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-4 min-h-[500px]">
                <div className="w-full md:col-span-1 bg-gray-50 p-6 border-b md:border-b-0 md:border-r border-gray-100 flex md:flex-col gap-4 overflow-x-auto md:overflow-x-visible no-scrollbar shrink-0">
                    <div className="shrink-0 flex md:flex-col gap-4 items-center md:items-start w-full">
                        <h5 className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ferramentas</h5>
                        <div className="flex md:flex-col gap-3 w-full">
                            {[
                                { icon: <Type size={16} />, label: 'Texto', type: 'text' },
                                { icon: <AlignLeft size={16} />, label: 'Parágrafo', type: 'textarea' },
                                { icon: <ToggleLeft size={16} />, label: 'Booleano', type: 'boolean' },
                                { icon: <List size={16} />, label: 'Seleção', type: 'select' },
                                { icon: <Users size={16} />, label: 'Atendente', type: 'staff' },
                                { icon: <Info size={16} />, label: 'Título', type: 'heading' }
                            ].map(item => (
                                <button key={item.label} onClick={() => addField(item.type as AnamnesisFieldType)} className="shrink-0 md:w-full p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-transparent shadow-sm hover:border-indigo-200 flex items-center gap-3 md:gap-4 group">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white shrink-0">{item.icon}</div>
                                    <span className="text-[10px] md:text-xs font-bold text-gray-600 whitespace-nowrap">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:block pt-6 border-t border-gray-200 mt-auto">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Categoria</label>
                        <select value={template.category} onChange={e => onChange({ ...template, category: e.target.value })} className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold text-gray-700">
                            {['Cílios', 'Sobrancelha', 'Estética', 'Unhas', 'Geral'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="w-full md:col-span-3 p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto scrollbar-hide max-h-[600px] bg-white">
                    <div className="md:hidden mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Categoria</label>
                        <select value={template.category} onChange={e => onChange({ ...template, category: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold text-gray-700">
                            {['Cílios', 'Sobrancelha', 'Estética', 'Unhas', 'Geral'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {template.fields.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-100 rounded-[2rem]">
                            <Plus className="text-gray-200 mb-4" size={48} />
                            <p className="text-gray-400 font-bold text-sm">Arraste uma ferramenta ou clique acima para começar a construir seu protocolo.</p>
                        </div>
                    )}

                    {template.fields.map((field, idx) => (
                        <div key={field.id} className="group relative bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 hover:border-[#FF69B4] transition-all shadow-sm">
                            <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 hidden md:flex">
                                <button onClick={() => moveField(idx, 'up')} className="p-1 bg-white border rounded shadow-sm hover:text-indigo-600"><ChevronLeft size={12} className="rotate-90" /></button>
                                <button onClick={() => moveField(idx, 'down')} className="p-1 bg-white border rounded shadow-sm hover:text-indigo-600"><ChevronLeft size={12} className="-rotate-90" /></button>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 space-y-3 min-w-0">
                                    <textarea
                                        rows={1}
                                        value={field.label}
                                        onChange={e => {
                                            updateField(field.id, { label: e.target.value });
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        className="w-full font-bold text-gray-800 text-base md:text-lg border-none p-0 focus:ring-0 outline-none resize-none bg-transparent overflow-hidden"
                                        placeholder="Pergunta ou Título"
                                    />
                                    {field.type === 'select' && (
                                        <input value={field.options?.join(', ')} onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold" placeholder="Opções (sep. por vírgula)" />
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="w-4 h-4 rounded text-indigo-600" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Obrigatório</span>
                                        </label>
                                        <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-3 py-1 rounded-full uppercase">{field.type}</span>
                                        <div className="flex md:hidden gap-2">
                                            <button onClick={() => moveField(idx, 'up')} className="p-1 text-gray-300 hover:text-indigo-600"><ChevronLeft size={14} className="rotate-90" /></button>
                                            <button onClick={() => moveField(idx, 'down')} className="p-1 text-gray-300 hover:text-indigo-600"><ChevronLeft size={14} className="-rotate-90" /></button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => onShowConfirm({
                                    title: 'Remover Campo?',
                                    message: `Deseja excluir o campo "${field.label}"?`,
                                    variant: 'danger',
                                    onConfirm: () => onChange({ ...template, fields: template.fields.filter(f => f.id !== field.id) })
                                })} className="p-2 text-gray-300 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={18} /></button>
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
    staff: Professional[];
    onSave: (sig: string) => void;
    onCancel: () => void;
    playingRecord: Partial<AnamnesisRecord>;
    onUpdateRecord: (r: Partial<AnamnesisRecord>) => void;
    step: number;
    setStep: (s: number) => void;
    onPrevStep: () => void;
    onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ template, clients, staff, onSave, onCancel, playingRecord, onUpdateRecord, step, setStep, onPrevStep, onShowToast }) => {
    const sigCanvas = useRef<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [staffSearch, setStaffSearch] = useState('');
    const [showAftercare, setShowAftercare] = useState(false);

    const isClientStep = step === 0;
    const totalSteps = template.fields.length + 1;
    const currentField = !isClientStep && step <= template.fields.length ? template.fields[step - 1] : null;
    const isSignatureStep = step === totalSteps;

    const filteredClients = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return clients.filter(c => c.name.toLowerCase().includes(lower) || c.phone.toLowerCase().includes(lower));
    }, [clients, searchTerm]);

    const filteredStaff = useMemo(() => {
        const lower = staffSearch.toLowerCase();
        return staff.filter(s => s.name.toLowerCase().includes(lower) || s.role.toLowerCase().includes(lower));
    }, [staff, staffSearch]);

    const setAnswer = (fieldId: string, value: any) => {
        onUpdateRecord({ ...playingRecord, answers: { ...(playingRecord.answers || {}), [fieldId]: value } });
    };

    const handleNext = (override?: { fieldId: string, value: any }) => {
        const answers = override
            ? { ...(playingRecord.answers || {}), [override.fieldId]: override.value }
            : (playingRecord.answers || {});

        if (isClientStep && !playingRecord.clientId) {
            onShowToast('Selecione uma cliente para continuar.', 'error');
            return;
        }

        if (currentField && currentField.required && currentField.type !== 'heading') {
            const ans = answers[currentField.id];
            const hasAnswer = ans !== undefined && ans !== null && ans !== '';
            if (!hasAnswer) {
                onShowToast('Este campo é obrigatório.', 'error');
                return;
            }
        }
        setStep(step + 1);
    };

    const setAnswerAndNext = (fieldId: string, value: any) => {
        setAnswer(fieldId, value);
        handleNext({ fieldId, value });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] bg-white flex flex-col font-sans">
            <header className="px-6 md:px-20 py-4 md:py-8 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0 z-[160]">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0"><Sparkles size={20} className="md:w-6 md:h-6" /></div>
                    <div className="min-w-0">
                        <h2 className="font-serif text-lg md:text-2xl text-gray-900 truncate">{template.title}</h2>
                        <p className="text-[8px] md:text-[10px] font-black uppercase text-[#FF69B4] tracking-[0.2em] md:tracking-[0.3em] truncate">BellaAI Luxury Experience</p>
                    </div>
                </div>
                <button onClick={onCancel} className="p-3 bg-gray-50 text-gray-400 hover:text-rose-500 rounded-xl transition-all shrink-0"><X size={18} /></button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                {/* Phases Side/Top Bar */}
                <div className="w-full md:w-80 bg-gray-50/50 p-6 md:p-12 border-b md:border-b-0 md:border-r border-gray-100 shrink-0">
                    <div className="flex flex-col gap-6 md:gap-12">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4">Fases do Protocolo</p>

                            {/* Horizontal Progress on Mobile */}
                            <div className="flex md:hidden items-center gap-1 w-full overflow-hidden">
                                {[{ label: 'Identificação', s: 0 }, ...template.fields.map((f, i) => ({ label: f.label, s: i + 1 })), { label: 'Finalização', s: totalSteps }].map((sObj, i) => {
                                    const isActive = step === sObj.s;
                                    const isDone = step > sObj.s;
                                    return (
                                        <div key={i} className={`h-1 rounded-full flex-1 transition-all ${isDone ? 'bg-emerald-400' : isActive ? 'bg-[#FF69B4]' : 'bg-gray-200'}`} />
                                    );
                                })}
                            </div>

                            {/* Vertical List for Desktop and some mobile detail */}
                            <div className="hidden md:flex flex-col space-y-3">
                                {[{ label: 'Identificação', s: 0 }, ...template.fields.map((f, i) => ({ label: f.label, s: i + 1 })), { label: 'Finalização', s: totalSteps }].map((sObj, i) => {
                                    const isActive = step === sObj.s;
                                    const isDone = step > sObj.s;
                                    return (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-400' : isActive ? 'bg-[#FF69B4] scale-150' : 'bg-gray-200'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest truncate ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>{sObj.label}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Step Indicator on Mobile */}
                            <div className="md:hidden flex justify-between items-center mt-2">
                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                    {step === 0 ? 'Identificação' : step === totalSteps ? 'Finalização' : template.fields[step - 1]?.label.slice(0, 30)}
                                </p>
                                <span className="text-[10px] font-bold text-gray-400">{step + 1}/{totalSteps + 1}</span>
                            </div>
                        </div>

                        {playingRecord.clientId && (
                            <div className="pt-6 md:pt-12 border-t border-gray-100 hidden md:block">
                                <p className="text-sm font-bold text-gray-900 truncate">{playingRecord.clientName}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Cliente Selecionada</p>
                            </div>
                        )}
                    </div>
                </div>

                <main className="flex-1 bg-white flex flex-col items-center justify-center p-6 md:p-20 relative overflow-y-auto">
                    <div className="w-full max-w-2xl flex flex-col items-center justify-center flex-1 py-10 md:py-0">
                        <AnimatePresence mode="wait">
                            <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full text-center space-y-8 md:space-y-12">
                                {isClientStep && (
                                    <div className="space-y-8 md:space-y-10">
                                        <h3 className="font-serif text-3xl md:text-5xl text-gray-900 leading-tight">Seja bem-vinda.</h3>
                                        <div className="relative max-w-md mx-auto">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                            <input type="text" placeholder="Nome da cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border-none rounded-[1.5rem] md:rounded-3xl py-5 md:py-6 pl-16 pr-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-pink-50 transition-all text-sm md:text-base" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredClients.map(c => (
                                                <button key={c.id} onClick={() => { onUpdateRecord({ ...playingRecord, clientId: c.id, clientName: c.name }); setStep(1); }} className="p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 border-transparent bg-gray-50/50 hover:border-[#FF69B4] hover:bg-white hover:shadow-xl transition-all flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#FF69B4] font-black shrink-0">{c.name[0]}</div>
                                                        <div className="text-left min-w-0"><p className="font-serif text-base md:text-lg text-gray-900 leading-none truncate">{c.name}</p></div>
                                                    </div>
                                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-[#FF69B4] shrink-0" />
                                                </button>
                                            ))}
                                            {filteredClients.length === 0 && (
                                                <p className="text-gray-400 font-medium py-10">Nenhuma cliente encontrada.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {currentField && (
                                    <div className="space-y-8 md:space-y-12 px-2">
                                        <h3 className="font-serif text-xl md:text-4xl lg:text-5xl text-gray-900 leading-tight">{currentField.label}</h3>
                                        {currentField.type === 'heading' ? (
                                            <div className="space-y-4">
                                                <button onClick={() => handleNext()} className="bg-gray-900 text-white px-10 md:px-12 py-5 md:py-6 rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-2xl hover:scale-[1.05] transition-all">Iniciar Seção <ChevronRight className="inline ml-2" size={18} /></button>
                                            </div>
                                        ) : (
                                            <div className="w-full">
                                                {currentField.type === 'text' && !currentField.label.includes('Lash Designer') && <input autoFocus value={playingRecord.answers?.[currentField.id] || ''} onChange={e => setAnswer(currentField.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNext()} className="w-full bg-transparent border-b-2 border-gray-100 py-4 md:py-6 text-center text-xl md:text-4xl font-serif text-[#FF69B4] outline-none focus:border-[#FF69B4] transition-all" placeholder="Escreva aqui..." />}
                                                {currentField.type === 'textarea' && <textarea autoFocus value={playingRecord.answers?.[currentField.id] || ''} onChange={e => setAnswer(currentField.id, e.target.value)} className="w-full bg-gray-50 rounded-2xl md:rounded-[3rem] p-6 md:p-12 text-base md:text-2xl font-serif text-center outline-none focus:ring-4 focus:ring-pink-50 min-h-[150px] md:min-h-[250px]" placeholder="Sua resposta..." />}
                                                {currentField.type === 'boolean' && (
                                                    <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-xl mx-auto w-full">
                                                        <button onClick={() => setAnswerAndNext(currentField.id, true)} className={`p-6 md:p-12 rounded-2xl md:rounded-[3rem] border-2 transition-all flex flex-col items-center gap-3 md:gap-4 ${playingRecord.answers?.[currentField.id] === true ? 'bg-gray-900 border-gray-900 text-white shadow-xl' : 'bg-gray-50 border-transparent text-gray-400 hover:border-[#FF69B4]'}`}><Check size={24} className="md:w-10 md:h-10" /><span className="font-serif text-lg md:text-3xl">Sim</span></button>
                                                        <button onClick={() => setAnswerAndNext(currentField.id, false)} className={`p-6 md:p-12 rounded-2xl md:rounded-[3rem] border-2 transition-all flex flex-col items-center gap-3 md:gap-4 ${playingRecord.answers?.[currentField.id] === false ? 'bg-gray-900 border-gray-900 text-white shadow-xl' : 'bg-gray-50 border-transparent text-gray-400 hover:border-[#FF69B4]'}`}><X size={24} className="md:w-10 md:h-10" /><span className="font-serif text-lg md:text-3xl">Não</span></button>
                                                    </div>
                                                )}
                                                {currentField.type === 'select' && (
                                                    <div className="space-y-8 w-full max-w-2xl mx-auto">
                                                        {(currentField.id === 'mapping' || currentField.label.includes('Curvatura') || currentField.label.includes('Espessura')) && (
                                                            <motion.p
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="text-[11px] md:text-sm text-gray-400 font-medium text-center leading-relaxed italic max-w-lg mx-auto"
                                                            >
                                                                {currentField.id === 'mapping'
                                                                    ? '"O mapping define o design e o comprimento dos fios usados para harmonizar e realçar a beleza única do seu olhar."'
                                                                    : currentField.label.includes('Curvatura')
                                                                        ? '"A curvatura define o \'formato\' do olhar e o nível de drama."'
                                                                        : '"A espessura determina o peso da extensão. Escolher uma muito pesada pode causar a queda precoce do cílio natural."'
                                                                }
                                                            </motion.p>
                                                        )}
                                                        <div className={`grid gap-3 md:gap-4 w-full ${(currentField.id === 'mapping' || currentField.label.includes('Curvatura') || currentField.label.includes('Espessura')) ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                                            {currentField.options?.map(opt => {
                                                                const isMapping = currentField.id === 'mapping';
                                                                const isCurvatura = currentField.label.includes('Curvatura');
                                                                const isEspessura = currentField.label.includes('Espessura');

                                                                const mappingDescriptions: Record<string, string> = {
                                                                    'Gatinho (Cat Eye)': 'Fios maiores no canto externo para alongar e sofisticar o olhar.',
                                                                    'Boneca (Doll)': 'Fios maiores no centro para abrir o olhar e conferir um ar romântico.',
                                                                    'Esquilo (Squirrel)': 'Fios longos no arco da sobrancelha, ideal para levantar olhos caídos.',
                                                                    'Fox Eye': 'Cria um efeito de "puxado" intenso e moderno, além do clássico gatinho.',
                                                                    'Natural': 'Equilíbrio sutil que respeita o crescimento original dos seus fios.'
                                                                };

                                                                const curvaturaDescriptions: Record<string, string> = {
                                                                    'J e B': 'Curvaturas bem naturais, quase retas. A B tem uma leve elevação na ponta, ideal para quem quer apenas definição.',
                                                                    'C': 'A mais versátil e utilizada. Oferece um efeito de cílios curvados com curvex, mantendo um aspecto natural.',
                                                                    'CC / D': 'Curvaturas acentuadas para um olhar mais aberto e dramático (efeito boneca). A D é ideal para clientes que buscam impacto visual.',
                                                                    'L e M': 'Possuem uma base reta e uma subida súbita. São excelentes para pálpebras caídas (hooded eyes) ou para criar o efeito "foxy eyes" (delineado).'
                                                                };

                                                                const thicknessDescriptions: Record<string, string> = {
                                                                    'Volume Russo e Mega Volume (0.03mm a 0.07mm)': 'Extremamente leves e finos. Permitem a criação de "fans" (leques) artesanais com 3 a 15 fios em um único cílio natural, proporcionando desde um volume macio e "fluffy" até uma densidade dramática e luxuosa, sem sobrecarregar a raiz.',
                                                                    'Híbrido ou Volume Suave (0.10mm a 0.12mm)': 'A ponte perfeita entre o sutil e o marcante. Ideais para técnicas como o "Wet Effect" (efeito molhado) ou um volume híbrido sofisticado. Oferecem textura e profundidade ao olhar sem o peso do clássico mais grosso.',
                                                                    'Fio a Fio / Clássico (0.15mm a 0.20mm)': 'A essência da elegância atemporal. O 0.15mm simula o efeito de rímel de alta definição, seguro para a maioria. O 0.20mm entrega impacto imediato, mas exige fios naturais fortes para suportar o peso com segurança.',
                                                                    'Não Recomendados (0.25mm ou mais)': '⚠️ Risco Iminente. Excessivamente pesados e rígidos para a estrutura delicada do cílio humano. O uso pode causar alopecia por tração (falhas permanentes) e enfraquecimento severo. Priorizamos a saúde do seu olhar.'
                                                                };

                                                                const description = isMapping ? mappingDescriptions[opt] : (isCurvatura ? curvaturaDescriptions[opt] : (isEspessura ? thicknessDescriptions[opt] : null));

                                                                return (
                                                                    <button
                                                                        key={opt}
                                                                        onClick={() => setAnswerAndNext(currentField.id, opt)}
                                                                        className={`p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-2 group ${playingRecord.answers?.[currentField.id] === opt ? (isEspessura && opt.includes('Não Recomendados') ? 'bg-red-900 border-red-900 text-white shadow-xl translate-y-[-4px]' : 'bg-gray-900 border-gray-900 text-white shadow-xl translate-y-[-4px]') : (isEspessura && opt.includes('Não Recomendados') ? 'bg-red-50 border-transparent text-red-400 hover:border-red-300' : 'bg-gray-50 border-transparent text-gray-600 hover:border-[#FF69B4] hover:bg-white hover:shadow-lg')}`}
                                                                    >
                                                                        <span className="font-serif text-lg md:text-2xl">{opt}</span>
                                                                        {description && (
                                                                            <span className={`text-[10px] md:text-xs font-medium leading-tight opacity-70 group-hover:opacity-100 transition-opacity`}>
                                                                                {description}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                {(currentField.type === 'staff' || (currentField.type === 'text' && currentField.label.includes('Lash Designer'))) && (
                                                    <div className="space-y-6 w-full max-w-2xl mx-auto">
                                                        <div className="relative">
                                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar atendente..."
                                                                value={staffSearch}
                                                                onChange={(e) => setStaffSearch(e.target.value)}
                                                                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-pink-300 font-serif text-lg"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                                                            {filteredStaff.map(member => (
                                                                <button
                                                                    key={member.id}
                                                                    onClick={() => setAnswerAndNext(currentField.id, member.name)}
                                                                    className={`p-4 md:p-5 rounded-2xl md:rounded-[2.5rem] border-2 transition-all flex items-center gap-4 ${playingRecord.answers?.[currentField.id] === member.name ? 'bg-gray-900 border-gray-900 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-600 hover:border-[#FF69B4]'}`}
                                                                >
                                                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                                                                        <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=random`} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="text-left min-w-0">
                                                                        <p className="font-serif text-base md:text-lg truncate leading-tight">{member.name}</p>
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 opacity-60 truncate">{member.role}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                            {filteredStaff.length === 0 && (
                                                                <p className="col-span-full py-10 text-gray-400 font-medium italic">Nenhum atendente encontrado.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isSignatureStep && (
                                    <div className="space-y-8 md:space-y-12 px-2">
                                        <div className="space-y-2">
                                            <h3 className="font-serif text-2xl md:text-5xl text-gray-900">Validar Prontuário</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sua assinatura garante segurança e procedência.</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl md:rounded-[4rem] p-4 md:p-10 border-2 border-dashed border-gray-200 relative overflow-hidden group shadow-inner">
                                            <SignatureCanvas ref={sigCanvas} penColor='#111827' canvasProps={{ className: 'w-full h-48 md:h-80 cursor-crosshair' }} />
                                            <button onClick={() => sigCanvas.current?.clear()} className="absolute bottom-4 left-6 md:bottom-10 md:left-12 text-[9px] font-black uppercase text-gray-400 hover:text-rose-500 transition-colors bg-white/80 py-1 px-3 rounded-lg">Limpar</button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="w-full flex items-center justify-between max-w-4xl py-6 md:py-10 mt-auto bg-white border-t border-gray-50 sm:border-none">
                        {!isClientStep && <button onClick={onPrevStep} className="flex items-center gap-2 text-gray-300 font-black uppercase text-[9px] md:text-[10px] hover:text-gray-900 transition-all"><ChevronLeft size={16} /> Voltar</button>}
                        <div className="flex-1" />
                        {!isSignatureStep && !isClientStep && <button onClick={() => handleNext()} className="bg-gray-900 text-white px-6 md:px-12 py-3.5 md:py-6 rounded-full font-black text-[9px] md:text-xs uppercase tracking-widest hover:scale-[1.05] transition-all">Próximo <ChevronRight className="inline ml-1" size={14} /></button>}
                        {isSignatureStep && <button onClick={() => { if (!sigCanvas.current?.isEmpty()) setShowAftercare(true); else onShowToast('Assinatura obrigatória!', 'error'); }} className="bg-indigo-600 text-white px-8 md:px-14 py-4 md:py-7 rounded-full font-black text-[10px] md:text-sm uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-2xl hover:scale-[1.05] transition-all">Finalizar <CheckCircle2 className="inline ml-2" size={20} /></button>}
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
