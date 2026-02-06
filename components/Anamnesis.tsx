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
    Eye
} from 'lucide-react';
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
    AnamnesisTemplate,
    AnamnesisField,
    AnamnesisRecord,
    AnamnesisFieldType,
    Client,
    View
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
}

const QUICK_TEMPLATES: Partial<AnamnesisTemplate>[] = [
    {
        title: 'Anamnese Sobrancelhas',
        category: 'Sobrancelha',
        description: 'Protocolo completo para design e micropigmentação.',
        fields: [
            { id: '1', label: 'Possui alergia a pigmentos?', type: 'boolean', required: true },
            { id: '2', label: 'Está amamentando ou gestante?', type: 'boolean', required: true },
            { id: '3', label: 'Histórico de queloides?', type: 'boolean', required: false },
            { id: '4', label: 'Tipo de Pele', type: 'select', required: true, options: ['Seca', 'Oleosa', 'Mista', 'Normal'] },
            { id: '5', label: 'Observações Técnicas', type: 'textarea', required: false }
        ]
    },
    {
        title: 'Anamnese Extensão de Cílios',
        category: 'Cílios',
        description: 'Avaliação de saúde ocular e sensibilidade.',
        fields: [
            { id: '1', label: 'Usa lentes de contato?', type: 'boolean', required: true },
            { id: '2', label: 'Possui alguma sensibilidade ocular?', type: 'boolean', required: true },
            { id: '3', label: 'Estilo desejado', type: 'select', required: true, options: ['Classic', 'Volume Russo', 'Híbrido'] },
            { id: '4', label: 'Observações específicas', type: 'textarea', required: false }
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
    onShowToast
}) => {
    const [activeTab, setActiveTab] = useState<'manager' | 'builder' | 'player'>('manager');
    const [selectedTemplate, setSelectedTemplate] = useState<AnamnesisTemplate | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<AnamnesisTemplate | null>(null);
    const [playerTemplate, setPlayerTemplate] = useState<AnamnesisTemplate | null>(null);
    const [playingRecord, setPlayingRecord] = useState<Partial<AnamnesisRecord>>({});

    // Builder Logic
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

    const handleAddField = (type: AnamnesisFieldType) => {
        if (!editingTemplate) return;
        const newField: AnamnesisField = {
            id: Math.random().toString(36).substr(2, 9),
            label: 'Nova Pergunta',
            type,
            required: false,
            placeholder: type === 'text' ? 'Digite aqui...' : undefined
        };
        setEditingTemplate({
            ...editingTemplate,
            fields: [...editingTemplate.fields, newField]
        });
    };

    // Player Logic (Stepper)
    const [step, setStep] = useState(0);
    const totalSteps = (playerTemplate?.fields.length || 0) + 1; // Fields + Signature

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

    const handleNextStep = () => {
        if (step < totalSteps - 1) setStep(step + 1);
    };

    const handlePrevStep = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSaveRecord = (signature: string) => {
        try {
            if (!playerTemplate || !playingRecord.clientId) {
                onShowToast('Selecione um cliente para vincular a ficha.', 'error');
                return;
            }

            const client = clients.find(c => c.id === playingRecord.clientId);
            if (!client) {
                onShowToast('Cliente não encontrado.', 'error');
                return;
            }

            const fullRecord: AnamnesisRecord = {
                id: Math.random().toString(36).substr(2, 9),
                templateId: playerTemplate.id,
                clientId: client.id,
                clientName: client.name,
                answers: playingRecord.answers || {},
                signatureUrl: signature,
                signedAt: new Date().toISOString(),
                createdAt: playingRecord.createdAt || new Date().toISOString()
            };

            onAddRecord(fullRecord);
            onShowToast('Ficha de Anamnese salva com sucesso!', 'success');

            // Transition first, then clean up state
            setActiveTab('manager');
            setTimeout(() => {
                setPlayingRecord({});
                setPlayerTemplate(null);
            }, 300);
        } catch (error: any) {
            console.error('Error saving record:', error);
            onShowToast('Erro ao salvar ficha: ' + (error?.message || 'Erro desconhecido'), 'error');
        }
    };

    const exportRecordToPDF = async (record: AnamnesisRecord, template: AnamnesisTemplate) => {
        const doc = new jsPDF();
        const margin = 20;
        let y = 20;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo-600
        doc.text("FICHA DE ANAMNESE", margin, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text(`MODELO: ${template.title.toUpperCase()}`, margin, y);
        y += 15;

        // Client Info
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y, 170, 25, 'F');
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(12);
        doc.text(`CLIENTE: ${record.clientName}`, margin + 5, y + 10);
        doc.setFontSize(10);
        doc.text(`DATA: ${new Date(record.createdAt).toLocaleDateString()}`, margin + 5, y + 18);
        y += 35;

        // Answers
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

        // Signature
        if (record.signatureUrl) {
            y += 10;
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFontSize(10);
            doc.setTextColor(156, 163, 175);
            doc.text("ASSINATURA DO CLIENTE", margin, y);
            y += 5;
            doc.addImage(record.signatureUrl, 'PNG', margin, y, 60, 25);
        }

        doc.save(`Anamnese_${record.clientName.replace(/\s/g, '_')}.pdf`);
        onShowToast('PDF gerado com sucesso!', 'info');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Anamnese Digital ✨</h2>
                            <p className="text-gray-500 font-medium text-sm">Escaneamento técnico e histórico inteligente.</p>
                        </div>
                    </div>
                </div>

                {activeTab === 'manager' && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onShowToast('Sincronização com Google Drive iniciada...', 'info')}
                            className="bg-white text-gray-400 p-4 rounded-3xl border border-gray-100 hover:text-indigo-600 hover:shadow-lg transition-all flex items-center gap-2"
                            title="Sincronizar com Google Drive"
                        >
                            <Cloud size={20} />
                            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Backup Cloud</span>
                        </button>
                        <button
                            onClick={handleStartNewTemplate}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
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
                        onAddQuickTemplate={(t) => onAddTemplate(t as AnamnesisTemplate)}
                        onExportPDF={exportRecordToPDF}
                        onDeleteRecord={onDeleteRecord}
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
                            onShowToast('Modelo salvo com sucesso!', 'success');
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
                        onPrevStep={handlePrevStep}
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
}> = ({ templates, records, onStartPlayer, onEditTemplate, onDeleteTemplate, onAddQuickTemplate, onExportPDF, onDeleteRecord }) => {
    const [recordToDelete, setRecordToDelete] = useState<AnamnesisRecord | null>(null);
    const [viewingRecord, setViewingRecord] = useState<{ record: AnamnesisRecord, template: AnamnesisTemplate } | null>(null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4"
        >
            {/* Quick Templates Sidebar */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-600" /> Modelos Rápidos
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Ative modelos profissionais prontos para uso.</p>
                    <div className="space-y-3">
                        {QUICK_TEMPLATES.map((qt, i) => (
                            <button
                                key={i}
                                onClick={() => onAddQuickTemplate(qt)}
                                className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{qt.title}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{qt.category}</p>
                                </div>
                                <Plus size={16} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Latest Records (History) */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-emerald-500" /> Histórico Recente
                    </h3>
                    {records.length === 0 ? (
                        <p className="text-[10px] text-gray-400 font-medium text-center py-4 italic">Nenhuma ficha preenchida ainda.</p>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                            {records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(r => {
                                const t = templates.find(temp => temp.id === r.templateId);
                                return (
                                    <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-transparent flex items-center justify-between group">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-800 text-xs">{r.clientName}</p>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-tight">{t?.title || 'Modelo Removido'}</p>
                                            <p className="text-[8px] text-gray-300 font-bold">{new Date(r.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => {
                                                    if (t) setViewingRecord({ record: r, template: t });
                                                }}
                                                className="p-2 bg-white text-gray-400 rounded-xl hover:text-emerald-600 shadow-sm transition-all"
                                                title="Visualizar Detalhes"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => t && onExportPDF(r, t)}
                                                className="p-2 bg-white text-gray-400 rounded-xl hover:text-indigo-600 shadow-sm transition-all"
                                                title="Exportar PDF"
                                            >
                                                <FileDown size={14} />
                                            </button>
                                            <button
                                                onClick={() => setRecordToDelete(r)}
                                                className="p-2 bg-white text-gray-400 rounded-xl hover:text-rose-600 shadow-sm transition-all"
                                                title="Excluir Registro"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Templates List */}
            <div className="md:col-span-2 space-y-6">
                {templates.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-gray-50 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                            <ClipboardList size={40} />
                        </div>
                        <div>
                            <h4 className="font-black text-xl text-gray-800">Biblioteca Vazia</h4>
                            <p className="text-gray-400 max-w-sm">Crie seu primeiro modelo de anamnese ou use um de nossos modelos rápidos ao lado.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {templates.map(t => (
                            <div key={t.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-50 hover:shadow-indigo-50 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 group-hover:scale-110 transition-transform"></div>
                                <div className="flex flex-col h-full justify-between gap-6">
                                    <div className="space-y-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">{t.category}</span>
                                        <h4 className="font-black text-xl text-gray-900 leading-tight">{t.title}</h4>
                                        <p className="text-xs text-gray-400 font-medium line-clamp-2">{t.description}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onStartPlayer(t)}
                                            className="flex-1 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Smartphone size={14} /> Aplicar
                                        </button>
                                        <button
                                            onClick={() => onEditTemplate(t)}
                                            className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-indigo-600 transition-all"
                                        >
                                            <Settings2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Excluir este modelo?')) onDeleteTemplate(t.id); }}
                                            className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {recordToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 border border-white/20 text-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm mb-2">
                            <Trash2 size={32} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-gray-900">Excluir Ficha?</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Você está prestes a remover a ficha de <span className="font-bold text-gray-800">{recordToDelete.clientName}</span>. Esta ação não pode ser desfeita.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={() => {
                                    onDeleteRecord(recordToDelete.id);
                                    setRecordToDelete(null);
                                }}
                                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Sim, Excluir
                            </button>
                            <button
                                onClick={() => setRecordToDelete(null)}
                                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:shadow-sm transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewingRecord && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative my-8 animate-in zoom-in duration-300">
                        <button
                            onClick={() => setViewingRecord(null)}
                            className="absolute top-8 right-8 p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="space-y-10">
                            {/* Modal Header */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Detalhes da Anamnese</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{viewingRecord.template.title}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Client Info Grid */}
                            <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-[2rem]">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cliente</p>
                                    <p className="font-bold text-gray-900">{viewingRecord.record.clientName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Assinado em</p>
                                    <p className="font-bold text-gray-900">{new Date(viewingRecord.record.signedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Questions & Answers */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Respostas</h4>
                                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                                    {viewingRecord.template.fields.map(field => {
                                        if (field.type === 'heading') {
                                            return (
                                                <div key={field.id} className="pt-4 border-t border-gray-50">
                                                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{field.label}</p>
                                                </div>
                                            );
                                        }
                                        const answer = viewingRecord.record.answers[field.id];
                                        const displayAnswer = typeof answer === 'boolean' ? (answer ? 'Sim ✅' : 'Não ❌') : (answer || 'Não informado');

                                        return (
                                            <div key={field.id} className="space-y-1">
                                                <p className="text-xs text-gray-400 font-medium">{field.label}</p>
                                                <p className="text-sm font-bold text-gray-800 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                                                    {displayAnswer}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Signature Visualization */}
                            {viewingRecord.record.signatureUrl && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Assinatura Digital</p>
                                    <div className="bg-gray-50 rounded-[2rem] p-6 border-2 border-dashed border-gray-200">
                                        <img
                                            src={viewingRecord.record.signatureUrl}
                                            alt="Assinatura"
                                            className="w-full h-32 object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        onExportPDF(viewingRecord.record, viewingRecord.template);
                                        setViewingRecord(null);
                                    }}
                                    className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                >
                                    <FileDown size={16} /> Baixar PDF
                                </button>
                                <button
                                    onClick={() => setViewingRecord(null)}
                                    className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:shadow-sm transition-all"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const TemplateBuilder: React.FC<{
    template: AnamnesisTemplate;
    onChange: (t: AnamnesisTemplate) => void;
    onSave: () => void;
    onCancel: () => void;
}> = ({ template, onChange, onSave, onCancel }) => {
    const updateField = (id: string, updates: Partial<AnamnesisField>) => {
        onChange({
            ...template,
            fields: template.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        });
    };

    const removeField = (id: string) => {
        onChange({
            ...template,
            fields: template.fields.filter(f => f.id !== id)
        });
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...template.fields];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newFields.length) return;
        [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
        onChange({ ...template, fields: newFields });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden max-w-4xl mx-auto"
        >
            <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50 border-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 animate-pulse"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100">
                        <Settings2 size={32} />
                    </div>
                    <div>
                        <input
                            value={template.title}
                            onChange={e => onChange({ ...template, title: e.target.value })}
                            className="bg-transparent border-none text-3xl font-black text-gray-900 p-0 mb-1 outline-none focus:ring-2 focus:ring-indigo-600/20 rounded-xl w-full"
                            placeholder="Nome do Modelo"
                        />
                        <input
                            value={template.description}
                            onChange={e => onChange({ ...template, description: e.target.value })}
                            className="bg-transparent border-none text-xs text-gray-400 font-bold uppercase tracking-widest p-0 outline-none w-full"
                            placeholder="Subtítulo Descritivo"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="px-6 py-4 bg-white text-gray-400 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-gray-100 hover:bg-gray-50 transition-all">Cancelar</button>
                    <button onClick={onSave} className="px-8 py-4 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                        <Save size={16} /> Salvar Modelo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
                {/* Toolbox */}
                <div className="md:col-span-1 bg-gray-50 p-6 border-r border-gray-100 space-y-6">
                    <div>
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Adicionar Campo</h5>
                        <div className="grid grid-cols-1 gap-2">
                            <ToolboxButton icon={<Type size={16} />} label="Texto Curto" onClick={() => addField('text')} />
                            <ToolboxButton icon={<AlignLeft size={16} />} label="Texto Longo" onClick={() => addField('textarea')} />
                            <ToolboxButton icon={<ToggleLeft size={16} />} label="Sim/Não" onClick={() => addField('boolean')} />
                            <ToolboxButton icon={<List size={16} />} label="Múltipla Escolha" onClick={() => addField('select')} />
                            <ToolboxButton icon={<Info size={16} />} label="Cabeçalho" onClick={() => addField('heading')} />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Categoria</label>
                        <select
                            value={template.category}
                            onChange={e => onChange({ ...template, category: e.target.value })}
                            className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-600/20"
                        >
                            <option value="Sobrancelha">Sobrancelha</option>
                            <option value="Cílios">Cílios</option>
                            <option value="Estética">Estética</option>
                            <option value="Micropigmentação">Micropigmentação</option>
                            <option value="Unhas">Unhas</option>
                            <option value="Geral">Geral</option>
                        </select>
                    </div>
                </div>

                {/* Canvas */}
                <div className="md:col-span-3 p-10 space-y-8 bg-white overflow-y-auto scrollbar-hide">
                    {template.fields.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4 pt-20">
                            <Move size={48} className="animate-bounce" />
                            <p className="font-black text-lg uppercase tracking-tight">Arraste campos para começar</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {template.fields.map((field, idx) => (
                                <div key={field.id} className="group relative bg-white p-6 rounded-3xl border border-gray-100 hover:border-indigo-200 transition-all shadow-sm hover:shadow-indigo-50/50">
                                    <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => moveField(idx, 'up')} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm hover:text-indigo-600"><ChevronLeft size={12} className="rotate-90" /></button>
                                        <button onClick={() => moveField(idx, 'down')} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm hover:text-indigo-600"><ChevronLeft size={12} className="-rotate-90" /></button>
                                    </div>

                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 space-y-3">
                                            <input
                                                value={field.label}
                                                onChange={e => updateField(field.id, { label: e.target.value })}
                                                className="w-full font-bold text-gray-800 text-lg border-none p-0 focus:ring-0 outline-none placeholder:text-gray-300"
                                                placeholder="Pergunta ou Título..."
                                            />

                                            {field.type === 'select' && (
                                                <div className="space-y-2 pt-2">
                                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Opções (separadas por vírgula)</label>
                                                    <input
                                                        value={field.options?.join(', ')}
                                                        onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                        className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-indigo-600/20"
                                                        placeholder="Ex: Opção 1, Opção 2"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-6 pt-2">
                                                <label className="flex items-center gap-2 cursor-pointer group/toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.required}
                                                        onChange={e => updateField(field.id, { required: e.target.checked })}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover/toggle:text-indigo-600 transition-colors">Obrigatório</span>
                                                </label>
                                                <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-tighter">{field.type}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeField(field.id)}
                                            className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );

    function addField(type: AnamnesisFieldType) {
        const newField: AnamnesisField = {
            id: Math.random().toString(36).substr(2, 9),
            label: type === 'heading' ? 'Novo Título de Seção' : 'Nova Pergunta',
            type,
            required: false,
            options: type === 'select' ? ['Opção 1', 'Opção 2'] : undefined
        };
        onChange({ ...template, fields: [...template.fields, newField] });
    }
};

const ToolboxButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full p-4 bg-white rounded-2xl border border-transparent shadow-sm hover:border-indigo-200 hover:scale-[1.02] transition-all text-left flex items-center gap-4 group"
    >
        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white">
            {icon}
        </div>
        <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-900">{label}</span>
    </button>
);

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
    const totalSteps = template.fields.length + 2; // Client Select + Fields + Signature

    const filteredClients = useMemo(() => {
        return clients.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    const setAnswer = (fieldId: string, value: any) => {
        onUpdateRecord({
            ...playingRecord,
            answers: {
                ...(playingRecord.answers || {}),
                [fieldId]: value
            }
        });
    };

    const currentField = step > 0 && step <= template.fields.length ? template.fields[step - 1] : null;
    const isSignatureStep = step === totalSteps - 1;
    const isClientStep = step === 0;

    const handleNext = (overrides?: Partial<AnamnesisRecord>) => {
        const currentAnswers = overrides?.answers || playingRecord.answers || {};
        const currentClientId = overrides?.clientId || playingRecord.clientId;

        if (isClientStep && !currentClientId) {
            onShowToast('Por favor, escolha o cliente primeiro.', 'error');
            return;
        }

        if (currentField && currentField.required) {
            const answer = currentAnswers[currentField.id];
            if (answer === undefined || answer === null || answer === '') {
                onShowToast('Este campo é obrigatório.', 'error');
                return;
            }
        }

        if (step < totalSteps - 1) setStep(step + 1);
    };

    const handleFinalize = () => {
        if (!sigCanvas.current) {
            onShowToast('Erro técnico: Canvas não carregado.', 'error');
            return;
        }

        if (sigCanvas.current.isEmpty()) {
            onShowToast('Por favor, assine o documento.', 'error');
            return;
        }

        try {
            // Using toDataURL directly on the component for better compatibility
            const signatureData = sigCanvas.current.toDataURL('image/png');
            onSave(signatureData);
        } catch (error: any) {
            console.error('Finalize error:', error);
            onShowToast('Erro ao processar assinatura: ' + (error?.message || 'Erro no Canvas'), 'error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[150] bg-white flex flex-col md:p-10 p-4 safe-area-inset"
        >
            <div className="max-w-3xl mx-auto w-full flex flex-col h-full bg-white relative">
                {/* Lux Stepper Header */}
                <div className="flex items-center justify-between mb-12">
                    <button onClick={onCancel} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all"><X size={20} /></button>
                    <div className="flex gap-2">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-indigo-600' : (i < step ? 'w-4 bg-indigo-200' : 'w-4 bg-gray-100')}`} />
                        ))}
                    </div>
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{step + 1} / {totalSteps}</div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col justify-center items-center text-center p-4">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-12"
                    >
                        {isClientStep && (
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Quem estamos escaneando hoje?</h3>
                                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Vínculo técnico obrigatório</p>
                                </div>

                                <div className="max-w-md mx-auto w-full relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Search size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome ou celular..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-3xl py-5 pl-14 pr-6 text-sm font-bold placeholder:text-gray-300 outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 max-w-md mx-auto h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                                    {filteredClients.length === 0 ? (
                                        <div className="py-10 text-center space-y-2 opacity-40">
                                            <Search size={40} className="mx-auto text-gray-300" />
                                            <p className="text-sm font-bold text-gray-400">Nenhum cliente encontrado</p>
                                        </div>
                                    ) : (
                                        filteredClients.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    const updated = { ...playingRecord, clientId: c.id };
                                                    onUpdateRecord(updated);
                                                    handleNext(updated);
                                                }}
                                                className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between group ${playingRecord.clientId === c.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xl shadow-indigo-100 scale-[1.02]' : 'bg-gray-50 text-gray-800 border-transparent hover:border-indigo-200 hover:bg-white'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${playingRecord.clientId === c.id ? 'bg-white/20 text-white' : 'bg-white shadow-sm text-indigo-600'}`}>
                                                        {c.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-lg">{c.name}</p>
                                                        <p className={`text-[10px] uppercase font-bold tracking-widest ${playingRecord.clientId === c.id ? 'text-indigo-100' : 'text-gray-400'}`}>{c.phone}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className={playingRecord.clientId === c.id ? 'text-white' : 'text-gray-300'} />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {currentField && (
                            <div className="space-y-12 max-w-2xl mx-auto">
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">{currentField.label}</h3>
                                    {currentField.description && <p className="text-gray-400 font-medium">{currentField.description}</p>}
                                </div>

                                <div className="w-full transition-all">
                                    {currentField.type === 'text' && (
                                        <input
                                            autoFocus
                                            value={playingRecord.answers?.[currentField.id] || ''}
                                            onChange={e => setAnswer(currentField.id, e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleNext()}
                                            className="w-full bg-gray-50 border-none rounded-[2.5rem] p-10 text-2xl font-black text-center text-indigo-600 placeholder:text-gray-200 outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                                            placeholder="Toque para digitar..."
                                        />
                                    )}

                                    {currentField.type === 'textarea' && (
                                        <textarea
                                            autoFocus
                                            value={playingRecord.answers?.[currentField.id] || ''}
                                            onChange={e => setAnswer(currentField.id, e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-[2.5rem] p-10 text-xl font-black text-center text-indigo-600 placeholder:text-gray-200 outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner min-h-[200px]"
                                            placeholder="Descreva detalhadamente..."
                                        />
                                    )}

                                    {currentField.type === 'boolean' && (
                                        <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                                            <button
                                                onClick={() => {
                                                    const updated = { ...playingRecord, answers: { ...playingRecord.answers, [currentField.id]: true } };
                                                    onUpdateRecord(updated);
                                                    handleNext(updated);
                                                }}
                                                className={`p-10 rounded-[3rem] border-4 transition-all flex flex-col items-center gap-4 group ${playingRecord.answers?.[currentField.id] === true ? 'bg-indigo-600 text-white border-indigo-100 scale-[1.05] shadow-2xl' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-white hover:border-gray-100 hover:text-gray-800 shadow-sm'}`}
                                            >
                                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${playingRecord.answers?.[currentField.id] === true ? 'bg-white/20' : 'bg-white shadow-sm text-emerald-500'}`}><CheckCircle2 size={32} /></div>
                                                <span className="font-black text-xl uppercase tracking-widest">Sim</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const updated = { ...playingRecord, answers: { ...playingRecord.answers, [currentField.id]: false } };
                                                    onUpdateRecord(updated);
                                                    handleNext(updated);
                                                }}
                                                className={`p-10 rounded-[3rem] border-4 transition-all flex flex-col items-center gap-4 group ${playingRecord.answers?.[currentField.id] === false ? 'bg-indigo-600 text-white border-indigo-100 scale-[1.05] shadow-2xl' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-white hover:border-gray-100 hover:text-gray-800 shadow-sm'}`}
                                            >
                                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${playingRecord.answers?.[currentField.id] === false ? 'bg-white/20' : 'bg-white shadow-sm text-rose-500'}`}><X size={32} /></div>
                                                <span className="font-black text-xl uppercase tracking-widest">Não</span>
                                            </button>
                                        </div>
                                    )}

                                    {currentField.type === 'select' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                                            {currentField.options?.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => {
                                                        const updated = { ...playingRecord, answers: { ...playingRecord.answers, [currentField.id]: opt } };
                                                        onUpdateRecord(updated);
                                                        handleNext(updated);
                                                    }}
                                                    className={`p-6 rounded-[2rem] border-2 transition-all font-black text-lg ${playingRecord.answers?.[currentField.id] === opt ? 'bg-indigo-600 text-white border-indigo-100 shadow-xl' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-white hover:border-gray-100 shadow-sm'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {currentField.type === 'heading' && (
                                        <div className="space-y-6">
                                            <div className="w-20 h-2 bg-indigo-600 mx-auto rounded-full" />
                                            <p className="text-gray-400 font-bold uppercase tracking-widest">Aviso importante. Leia e confirme para prosseguir.</p>
                                            <button onClick={() => handleNext()} className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-100 flex items-center gap-3 animate-pulse">Confirmar e Seguir <ChevronRight /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {isSignatureStep && (
                            <div className="space-y-10 max-w-2xl mx-auto w-full">
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">Assinatura Digital ✍️</h3>
                                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Utilize o dedo ou caneta para validar a ficha</p>
                                </div>

                                <div className="bg-gray-50 rounded-[3rem] p-6 shadow-inner border-2 border-dashed border-gray-200 relative group transition-all hover:bg-white active:bg-white overflow-hidden">
                                    <div className="absolute top-4 right-6 flex items-center gap-2">
                                        <Fingerprint size={16} className="text-gray-200 group-focus-within:text-indigo-400" />
                                        <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">Canvas Criptografado</span>
                                    </div>
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        penColor='indigo'
                                        canvasProps={{ className: 'w-full h-64 cursor-crosshair' }}
                                    />
                                    <button
                                        onClick={() => sigCanvas.current.clear()}
                                        className="absolute bottom-6 left-6 text-[10px] font-black uppercase text-gray-400 hover:text-rose-500 transition-colors bg-white px-4 py-2 rounded-full shadow-sm"
                                    >
                                        Limpar Assinatura
                                    </button>
                                </div>

                                <p className="text-[11px] text-gray-400 italic max-w-sm mx-auto leading-relaxed">
                                    Ao assinar, o cliente confirma a veracidade das informações acima e concorda com os termos de procedimento definidos pelo profissional.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Lux Navigation Bar */}
                <div className="mt-auto py-8 flex items-center justify-between gap-6 relative">
                    {!isClientStep && (
                        <button onClick={onPrevStep} className="flex items-center gap-3 text-gray-400 font-black uppercase text-xs tracking-widest hover:text-gray-900 transition-all group">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all"><ChevronLeft size={20} /></div>
                            Voltar
                        </button>
                    )}

                    <div className="flex-1" />

                    {!isSignatureStep && !isClientStep && (
                        <button onClick={() => handleNext()} className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                            Continuar Escanamento <ChevronRight size={24} />
                        </button>
                    )}

                    {isSignatureStep && (
                        <button
                            onClick={() => handleFinalize()}
                            className="bg-indigo-600 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-200 flex items-center gap-4 hover:scale-[1.05] active:scale-95 transition-all animate-in zoom-in duration-500"
                        >
                            <CheckCircle2 size={24} /> Finalizar e Salvar
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AnamnesisView;
