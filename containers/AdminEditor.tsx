
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { aiService } from '../services/aiService';
import { dbService } from '../services/dbService';
import { PostStatus, BlogPost, SeoConfig } from '../types';
import { 
  Sparkles, 
  Loader2, 
  ArrowLeft, 
  Zap, 
  CheckCircle, 
  ImageIcon, 
  Search, 
  Eye, 
  ExternalLink,
  AlignLeft,
  Settings2,
  Link as LinkIcon,
  Hash,
  Info,
  PenTool
} from 'lucide-react';

export const AdminEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [generatedData, setGeneratedData] = useState<Partial<BlogPost> | null>(null);

  const mdeOptions = useMemo(() => ({
    spellChecker: false,
    minHeight: "450px",
    status: false,
    placeholder: "Dica: Use # para títulos, * para listas e ** para negrito.",
    autosave: {
        enabled: true,
        uniqueId: id || "new-post-editor",
        delay: 1000,
    }
  }), [id]);

  useEffect(() => {
    if (id) {
      dbService.getPostById(id).then(post => {
        if (post) setGeneratedData(post);
      });
    }
  }, [id]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const result = await aiService.generateFullPost(topic);
      setGeneratedData({ 
        ...result, 
        status: PostStatus.DRAFT, 
        author: 'IA Specialist',
        seo: result.seo || { metaTitle: '', metaDescription: '', focusKeywords: [], slug: result.slug || '' }
      });
    } catch (err) { 
      alert("Falha na inteligência artificial. Tente novamente em instantes."); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleMagicSeo = async () => {
    if (!generatedData?.title || !generatedData?.content) return;
    setIsGeneratingSeo(true);
    try {
      const seo = await aiService.generateSeoMetadata(generatedData.title, generatedData.content);
      setGeneratedData(prev => prev ? { ...prev, seo } : null);
    } catch (err) {
      alert("Erro ao otimizar SEO.");
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleSave = async (status: PostStatus) => {
    if (!generatedData?.title) return;
    setIsSaving(true);
    try {
      const payload = { 
        ...generatedData, 
        status, 
        updatedAt: new Date().toISOString(),
        slug: generatedData.seo?.slug || generatedData.slug || generatedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      } as BlogPost;
      
      if (id) await dbService.updatePost(id, payload);
      else await dbService.createPost(payload);
      navigate('/admin');
    } catch (err) { 
      alert("Falha ao salvar no banco de dados."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const updateSeo = (field: keyof SeoConfig, value: any) => {
    if (!generatedData) return;
    setGeneratedData({
      ...generatedData,
      seo: { 
        ...(generatedData.seo || { metaTitle: '', metaDescription: '', focusKeywords: [], slug: '' }), 
        [field]: value 
      }
    });
  };

  const inputClasses = "w-full rounded-2xl border-slate-200 bg-slate-50/50 py-4 px-5 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none shadow-sm placeholder:text-slate-400 font-medium text-slate-700";
  const labelClasses = "block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 flex items-center gap-2";

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 px-4">
      {!generatedData ? (
          <div className="bg-white p-12 md:p-24 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 text-center space-y-10 max-w-4xl mx-auto border border-indigo-50/50 mt-12 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto text-white shadow-2xl shadow-indigo-200">
                <Sparkles size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Criador IA Premium</h2>
                <p className="text-slate-400 text-lg max-w-lg mx-auto">Transforme uma frase simples em um artigo de blog otimizado e engajador.</p>
              </div>
              <div className="flex flex-col gap-4 max-w-2xl mx-auto relative group">
                  <input 
                    type="text" 
                    value={topic} 
                    onChange={e => setTopic(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    className="w-full p-8 rounded-[2rem] border-2 border-slate-100 text-xl focus:ring-[1rem] focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all shadow-inner bg-slate-50/50 placeholder:text-slate-300 pr-40" 
                    placeholder="Ex: Como a IA vai mudar o RH em 2025" 
                  />
                  <button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} className="absolute right-3 top-3 bottom-3 bg-indigo-600 text-white px-8 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />} 
                    Gerar
                  </button>
              </div>
              <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Grounding Ativo</span>
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> SEO Otimizado</span>
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Imagem Inclusa</span>
              </div>
          </div>
      ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl sticky top-20 z-40 gap-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setGeneratedData(null)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                      <ArrowLeft size={24}/>
                    </button>
                    <div>
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-0.5">Workspace</h3>
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                             Artigo em Edição <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                        </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => handleSave(PostStatus.DRAFT)} disabled={isSaving} className="px-8 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm">Rascunho</button>
                      <button onClick={() => handleSave(PostStatus.PUBLISHED)} disabled={isSaving} className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 shadow-xl transition-all active:scale-95">
                          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} Publicar
                      </button>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <div className="bg-white p-10 md:p-14 rounded-[3rem] border border-slate-100 shadow-sm space-y-12">
                      <div className="space-y-4">
                        <label className={labelClasses}><AlignLeft size={14}/> Título Principal</label>
                        <textarea 
                          rows={2}
                          value={generatedData.title} 
                          onChange={e => setGeneratedData({...generatedData, title: e.target.value})} 
                          className="w-full text-5xl font-black border-none focus:ring-0 text-slate-900 p-0 placeholder:text-slate-100 resize-none bg-transparent" 
                          placeholder="Digite um título memorável..."
                        />
                        <div className="h-1.5 w-24 bg-indigo-600 rounded-full"></div>
                      </div>
                      
                      <div className="space-y-4">
                        <label className={labelClasses}><PenTool size={14}/> Conteúdo em Markdown</label>
                        <div className="prose-editor-wrapper rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50/30">
                          <SimpleMDE value={generatedData.content} onChange={v => setGeneratedData({...generatedData, content: v})} options={mdeOptions} />
                        </div>
                      </div>
                  </div>
                </div>

                <div className="space-y-10">
                  {/* SEO Module */}
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Search size={20} /></div>
                            <h3 className="text-xl font-black text-slate-900">SEO Magic</h3>
                        </div>
                        <button onClick={handleMagicSeo} disabled={isGeneratingSeo} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                            {isGeneratingSeo ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        </button>
                    </div>
                    
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between mb-2">
                             <label className={labelClasses}><Settings2 size={12}/> Meta Title</label>
                             <span className={`text-[9px] font-black uppercase px-2 rounded-full ${ (generatedData.seo?.metaTitle?.length || 0) > 60 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>{(generatedData.seo?.metaTitle?.length || 0)}/60</span>
                        </div>
                        <input type="text" value={generatedData.seo?.metaTitle || ''} onChange={e => updateSeo('metaTitle', e.target.value)} className={inputClasses} placeholder="Título orgânico..." />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                            <label className={labelClasses}><AlignLeft size={12}/> Meta Description</label>
                            <span className={`text-[9px] font-black uppercase px-2 rounded-full ${ (generatedData.seo?.metaDescription?.length || 0) > 160 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>{(generatedData.seo?.metaDescription?.length || 0)}/160</span>
                        </div>
                        <textarea rows={4} value={generatedData.seo?.metaDescription || ''} onChange={e => updateSeo('metaDescription', e.target.value)} className={`${inputClasses} resize-none py-4`} placeholder="Resumo chamativo..." />
                      </div>

                      <div>
                        <label className={labelClasses}><LinkIcon size={12}/> Slug Amigável</label>
                        <input type="text" value={generatedData.seo?.slug || ''} onChange={e => updateSeo('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} className={`${inputClasses} font-mono italic`} placeholder="url-do-artigo" />
                      </div>
                    </div>
                  </div>

                  {/* Image Module */}
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-xl"><ImageIcon size={20} /></div>
                        <h3 className="text-xl font-black text-slate-900">Capa</h3>
                    </div>
                    
                    {generatedData.coverImage ? (
                        <div className="relative group rounded-3xl overflow-hidden aspect-video border border-slate-100 shadow-lg">
                          <img src={generatedData.coverImage} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" alt="Preview" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 text-center">
                             <button onClick={() => setGeneratedData({...generatedData, coverImage: ''})} className="text-white text-[10px] font-black uppercase bg-red-600/80 backdrop-blur px-8 py-4 rounded-2xl shadow-xl hover:bg-red-600 transition-all">Remover Capa</button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 gap-3 group hover:border-indigo-200 transition-all shadow-inner">
                          <ImageIcon size={40} strokeWidth={1.5} className="group-hover:text-indigo-400 group-hover:scale-110 transition-all" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</span>
                        </div>
                      )}
                      <div className="pt-4">
                        <label className={labelClasses}><Hash size={12}/> Link Direto</label>
                        <input type="text" value={generatedData.coverImage || ''} onChange={e => setGeneratedData({...generatedData, coverImage: e.target.value})} placeholder="https://..." className={`${inputClasses} text-xs font-mono`} />
                      </div>
                  </div>
                </div>
              </div>
          </div>
      )}
    </div>
  );
};
