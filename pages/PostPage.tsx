
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { dbService } from '../services/dbService';
import { metaCapiService } from '../services/metaCapiService';
import { BlogPost } from '../types';
import { 
  Calendar, 
  ArrowLeft, 
  Clock, 
  List, 
  Share2, 
  ChevronRight, 
  User as UserIcon, 
  BookOpen
} from 'lucide-react';
import { AdUnit } from '../components/AdUnit';
import { useTheme } from '../contexts/ThemeContext';

const ReadingProgressBar = ({ width }: { width: number }) => {
  const { theme } = useTheme();
  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100/50 backdrop-blur-md">
      <div 
        className="h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]" 
        style={{ width: `${width}%`, backgroundColor: theme.primaryColor }} 
      />
    </div>
  );
};

export const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const { theme } = useTheme();

  // Helper para extrair texto de nós do React de forma segura
  const flattenText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(flattenText).join('');
    if (React.isValidElement(node)) return flattenText((node.props as any).children);
    if (node && typeof node === 'object' && node.props?.children) {
       return flattenText(node.props.children);
    }
    return '';
  };

  const slugify = (text: string) => 
    text.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const processedContent = useMemo(() => {
      if (!post) return '';
      let cleaned = post.content.replace(/\\n/g, '\n').replace(/&nbsp;/g, ' ').trim();
      const lines = cleaned.split('\n');
      if (lines.length > 0) {
          const firstLine = lines[0].toLowerCase().replace(/[#*]/g, '').trim();
          if (firstLine === post.title.toLowerCase().trim()) {
              cleaned = lines.slice(1).join('\n').trim();
          }
      }
      return cleaned;
  }, [post]);

  const toc = useMemo(() => {
    if (!processedContent) return [];
    const headings: { id: string; text: string; level: number }[] = [];
    processedContent.split('\n').forEach(line => {
      const match = line.match(/^(#{2,3})\s+(.*)/);
      if (match) {
        const text = match[2].replace(/[#*`_]/g, '').trim();
        headings.push({ id: slugify(text), text, level: match[1].length });
      }
    });
    return headings;
  }, [processedContent]);

  const readTime = useMemo(() => {
    if (!processedContent) return 0;
    const wordsPerMinute = 225;
    const words = processedContent.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }, [processedContent]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) setScrollProgress((window.scrollY / totalHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      try {
        const data = await dbService.getPostBySlug(slug);
        setPost(data || null);
        if (data) metaCapiService.sendViewContent(data.title, data.slug);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (loading || !post || toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) setActiveId(entry.target.id); });
      },
      { rootMargin: '-15% 0px -75% 0px' }
    );
    document.querySelectorAll('h2, h3').forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [loading, post, toc]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Carregando Conteúdo...</p>
    </div>
  );

  if (!post) return <div className="text-center py-20 font-bold text-slate-400 text-xl">Artigo não encontrado.</div>;

  const mdComponents = {
    h2: ({ children }: any) => {
      const text = flattenText(children);
      const id = slugify(text);
      return <h2 id={id} className="scroll-mt-28 text-3xl font-black text-slate-900 mt-16 mb-6 tracking-tight leading-tight">{children}</h2>;
    },
    h3: ({ children }: any) => {
      const text = flattenText(children);
      const id = slugify(text);
      return <h3 id={id} className="scroll-mt-28 text-xl font-bold text-slate-800 mt-10 mb-4 tracking-tight">{children}</h3>;
    },
    p: ({ children }: any) => <p className="mb-6 leading-relaxed text-slate-600 text-lg">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc pl-6 mb-8 space-y-3 text-slate-600 text-lg">{children}</ul>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/30 py-6 px-8 italic rounded-r-2xl mb-10 text-slate-700 text-lg md:text-xl leading-relaxed">{children}</blockquote>
  };

  return (
    <>
      <ReadingProgressBar width={scrollProgress} />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 pt-12">
          <article className="flex-1 min-w-0 pb-32">
            <Link to="/" className="inline-flex items-center text-slate-400 hover:text-indigo-600 mb-12 text-[10px] font-black uppercase tracking-widest transition-all group">
              <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Voltar ao Feed
            </Link>
            <header className="mb-16">
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 mb-8 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200"><UserIcon size={14} /></div>
                        <span className="text-slate-900">{post.author || 'IA Editor'}</span>
                    </div>
                    <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100"><Clock size={12} /> {readTime} min de leitura</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-10 tracking-tight">{post.title}</h1>
                <div className="flex flex-wrap gap-2 mb-12">
                    {post.tags.map(tag => <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200">#{tag}</span>)}
                </div>
            </header>
            {post.coverImage && <div className="relative mb-20 group"><div className="absolute -inset-2 bg-indigo-500/5 rounded-[2.5rem] blur-xl"></div><img src={post.coverImage} className="relative w-full rounded-[2rem] shadow-2xl aspect-video object-cover" alt={post.title} /></div>}
            <div className="max-w-[75ch] mx-auto lg:mx-0">
                <div className="prose prose-slate prose-lg md:prose-xl max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-indigo-600 prose-img:rounded-3xl prose-strong:text-slate-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{processedContent}</ReactMarkdown>
                </div>
                <AdUnit className="mt-24" />
            </div>
          </article>
          <aside className="w-full lg:w-80 lg:shrink-0 lg:order-last mb-12 lg:mb-0">
              <div className="sticky top-28 space-y-8">
                  <div className="bg-white rounded-[2rem] p-8 text-slate-900 shadow-xl border border-slate-100 relative overflow-hidden">
                      <h5 className="font-black text-[10px] uppercase tracking-widest mb-6 text-indigo-500 flex items-center gap-2"><BookOpen size={12} /> Leitura Atual</h5>
                      <div className="flex items-baseline gap-2 mb-6"><span className="text-5xl font-black leading-none">{Math.round(scrollProgress)}</span><span className="text-lg font-bold opacity-20">%</span></div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-8"><div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${scrollProgress}%` }}></div></div>
                      <button className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95"><Share2 size={14} /> Salvar Link</button>
                  </div>
                  {toc.length > 0 && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-widest text-[10px] text-indigo-500"><List size={14} /> Tópicos</h4>
                        <nav className="space-y-1">
                            {toc.map((item) => (
                                <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); }} className={`group flex items-start gap-3 py-2.5 text-[11px] transition-all duration-300 rounded-xl px-3 -mx-3 ${item.id === activeId ? 'text-indigo-600 font-black bg-indigo-50/50' : 'text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-50'} ${item.level === 3 ? 'pl-8' : ''}`}>
                                    <ChevronRight size={12} className={`mt-0.5 shrink-0 transition-all ${item.id === activeId ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} /><span className="leading-snug">{item.text}</span>
                                </a>
                            ))}
                        </nav>
                    </div>
                  )}
              </div>
          </aside>
        </div>
      </div>
    </>
  );
};
