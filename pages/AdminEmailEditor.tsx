import React, { useRef, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Layout, Loader2, CheckCircle2 } from 'lucide-react';

// Using standard React lazy instead of next/dynamic for better compatibility
const EmailEditor = lazy(() => import('react-email-editor'));

export const AdminEmailEditor: React.FC = () => {
  const emailEditorRef = useRef<any>(null);
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState('Novo Modelo de Email');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onReady = () => {
    console.log('Email Editor Ready');
  };

  const saveDesign = () => {
    if (!emailEditorRef.current?.editor) return;
    setSaving(true);
    setMessage(null);
    
    emailEditorRef.current.editor.saveDesign((design: any) => {
      emailEditorRef.current.editor.exportHtml(async (data: any) => {
        const { html } = data;
        try {
          const templates = JSON.parse(localStorage.getItem('email_templates') || '[]');
          templates.push({
            id: crypto.randomUUID(),
            name: templateName,
            design,
            html,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('email_templates', JSON.stringify(templates));
          
          setMessage('Design salvo com sucesso!');
          setTimeout(() => navigate('/admin/email'), 1500);
        } catch (err) {
          setMessage('Erro ao salvar template.');
        } finally {
          setSaving(false);
        }
      });
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 -m-4 sm:-m-8 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-50 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/admin/email')} 
            className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="space-y-1">
            <input 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-xl font-black text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-64"
              placeholder="Nome do Template"
            />
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 tracking-widest">
              <Layout size={12} /> Editor Visual Unlayer
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {message && (
                <div className="text-xs font-bold text-green-600 flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 size={14} /> {message}
                </div>
            )}
            <button 
                onClick={saveDesign} 
                disabled={saving}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
            >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Exportando...' : 'Salvar & Finalizar'}
            </button>
        </div>
      </div>

      <div className="flex-1 w-full bg-slate-100">
        <Suspense fallback={<div className="h-[calc(100vh-84px)] w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Carregando Editor Visual...</div>}>
          <EmailEditor 
              ref={emailEditorRef} 
              onReady={onReady} 
              minHeight="calc(100vh - 84px)"
          />
        </Suspense>
      </div>
    </div>
  );
};
