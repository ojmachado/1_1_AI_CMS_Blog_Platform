import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import dynamic from 'next/dynamic';
import { aiService } from '../services/aiService';
import { dbService } from '../services/dbService';
import { PostStatus, BlogPost } from '../types';
import { 
  Sparkles, 
  RotateCw, 
  ImageIcon, 
  Zap, 
  CheckCircle, 
  Loader2, 
  ArrowLeft, 
  AlertTriangle,
  Info,
  PenTool
} from 'lucide-react';

// Dynamic import for SimpleMDE to prevent SSR errors
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { 
  ssr: false,
  loading: () => <div className="h-[450px] w-full bg-slate-50 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">Carregando Editor...</div>
});

export const AdminEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedData, setGeneratedData] = useState<Partial<BlogPost> | null>(null);
  const [error, setError] = useState<{title: string, message: string} | null>(null);

  const mdeOptions = useMemo(() => ({
    spellChecker: false,
    placeholder: "Comece a escrever seu conteúdo em Markdown...",
    status: false,
    autosave: { enabled: true, uniqueId: id || "new-post-content", delay: 1000 },
    renderingConfig: { singleLineBreaks: false, codeSyntaxHighlighting: true },
  }), [id]);

  useEffect(() => {
    if (id) {
        dbService.getPostById(id).then(post => post && setGeneratedData(post));
    } else if (location.state?.initialTopic) {
        setTopic(location.state.initialTopic);
    }
  }, [id, location.state]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await aiService.generateFullPost(topic);
      const cleanedContent = result.content.replace(/\\n/g, '\n').trim();

      setGeneratedData({ 
        ...result, 
        content: cleanedContent,
        status: PostStatus.DRAFT, 
        author: 'IA Agent',
        tags: result.tags || [],
        seo: result.seo || { metaTitle: '', metaDescription: '', focusKeywords: [], slug: '' }
      });
    } catch (err: any) { 
        if (err.message?.includes("PERMISSAO_NEGADA_STORAGE")) {
            setError({ 
                title: "Erro de Permissão (Firebase Storage)", 
                message: "A IA gerou o texto, mas não conseguiu salvar a imagem. Vá no Console do Firebase > Storage > Rules e mude 'allow read, write: if false;' para 'if true;'" 
            });
        } else if (err.message?.includes("429")) {
            setError({ title: "Limite atingido", message: "Aguarde 60 segundos ou use uma chave paga." });
        } else {
            setError({ title: "Erro na geração", message: err.message || "Erro desconhecido." }); 
        }
    } finally { setIsGenerating(false); }
  };

  const handleSmartImageGeneration = async () => {
    if (!generatedData?.title) return;
    setIsGeneratingImage(true);
    setError(null);
    try {
      const url = await aiService.generateSmartImage(generatedData.title);
      setGeneratedData(prev => prev ? { ...prev, coverImage: url } : null);
    } catch (err: any) {
      setError({ title: "Falha ao gerar imagem", message: err.message });
    } finally { setIsGeneratingImage(false); }
  };

  const handleSave = async (status: PostStatus) => {
    if (!generatedData?.title) return;
    setIsSaving(true);
    try {
      const finalSlug = generatedData.seo?.slug || generatedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = { ...generatedData, slug: finalSlug, status, updatedAt: new Date().toISOString() } as BlogPost;
      if (id) await dbService.updatePost(id, payload);
      else await dbService.createPost(payload);
      navigate('/admin');
    } catch (err) { setError({ title: "Falha ao salvar", message: "Erro no banco de dados." }); } 
    finally { setIsSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4">
      {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
              <div className="p-2 bg-red-100 rounded-xl"><AlertTriangle size={24} /></div>
              <div className="flex-1">
                  <h4 className="font-black text-sm uppercase tracking-wider">{error.title}</h4>
                  <p className="text-sm mt-1 leading-relaxed opacity-80">{error.message}</p>
                  <button onClick={() => setError(null)} className="mt-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline">Fechar Alerta</button>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowLeft size={20} /></button>
            <div>
                <h1 className="text-2xl font-black text-slate-900">{id ? 'Refinar Artigo' : 'Nova Criação'}</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Workspace Editorial</p>
            </div>
        </div>
        <div className="flex gap-3">
            <button onClick={() => handleSave(PostStatus.DRAFT)} disabled={isSaving || !generatedData} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 disabled:opacity-50">Salvar Rascunho</button>
            <button onClick={() => handleSave(PostStatus.PUBLISHED)} disabled={isSaving || !generatedData} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />} Publicar
            </button>
        </div>
      </div>

      {!generatedData && (
        <div className="bg-white p-12 md:p-20 rounded-[3rem] shadow-xl border border-indigo-100 text-center space-y-8 max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto text-indigo-600 mb-2 shadow-inner"><Sparkles size={40} /></div>
            <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">O que vamos publicar hoje?</h2>
                <p className="text-slate-500 text-lg">Gere conteúdo épico em segundos com Inteligência Artificial.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                <input 
                    type="text" 
                    value={topic} 
                    onChange={e => setTopic(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    placeholder="Tópico ou Nicho..." 
                    className="w-full p-5 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm" 
                />
                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !topic.trim()} 
                    className="bg-indigo-600 text-white px-8 rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />} Gerar
                </button>
            </div>
        </div>
      )}

      {generatedData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest flex items-center gap-2"><Info size={12} /> Título do Conteúdo</label>
                        <input type="text" value={generatedData.title} onChange={e => setGeneratedData({...generatedData, title: e.target.value})} placeholder="Um título chamativo..." className="w-full text-4xl font-black border-none focus:ring-0 text-slate-900 p-0 bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 flex items-center gap-2"><PenTool size={12} /> Editor Markdown</label>
                        <SimpleMDE value={generatedData.content} onChange={v => setGeneratedData({...generatedData, content: v})} options={mdeOptions} />
                      </div>
                  </div>
              </div>

              <div className="space-y-8">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2"><ImageIcon size={18} className="text-indigo-600" /> Capa Destacada</h3>
                      <div className="aspect-[16/10] bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-100 relative group shadow-inner">
                          {isGeneratingImage && (
                              <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                                  <Loader2 className="animate-spin mb-2" size={32} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">IA gerando sua capa...</span>
                              </div>
                          )}
                          {generatedData.coverImage ? (
                              <img src={generatedData.coverImage} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="Capa" />
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                                  <ImageIcon size={40} strokeWidth={1} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Sem Capa</span>
                              </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                              <button onClick={handleSmartImageGeneration} disabled={isGeneratingImage || !generatedData.title} className="bg-white text-indigo-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-50 shadow-xl disabled:opacity-50">
                                  {isGeneratingImage ? <Loader2 className="animate-spin" size={14} /> : <RotateCw size={14} />} 
                                  {isGeneratingImage ? 'Gerando...' : 'Recriar Imagem'}
                              </button>
                          </div>
                      </div>
                      <div className="pt-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Link da Imagem</label>
                          <input 
                            type="text" 
                            value={generatedData.coverImage || ''} 
                            onChange={e => setGeneratedData({...generatedData, coverImage: e.target.value})} 
                            placeholder="https://..." 
                            className="w-full text-[10px] p-3 rounded-xl border border-slate-100 bg-slate-50 font-mono focus:ring-2 focus:ring-indigo-50 outline-none"
                          />
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};