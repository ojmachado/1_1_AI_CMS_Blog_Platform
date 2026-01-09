
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { getFirebaseConfigStatus } from '../lib/firebase';
import { AuthStep } from '../types';
import { 
  Sparkles, 
  AlertTriangle, 
  RefreshCw,
  ChevronRight,
  ClipboardCheck,
  Database,
  Settings
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();

  const [step, setStep] = useState<AuthStep>(AuthStep.EMAIL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{title: string, message: string} | null>(null);
  
  const [forceSetup, setForceSetup] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [configStatus, setConfigStatus] = useState({ isValid: true });

  useEffect(() => {
    const status = getFirebaseConfigStatus();
    setConfigStatus({ isValid: status.isValid });
  }, []);

  const handleManualConfigSave = () => {
    try {
      let raw = manualInput.trim();
      
      // 1. Remove comentários e declarações de variáveis (const firebaseConfig = )
      raw = raw.replace(/\/\/.*/g, ''); // Remove // comentários
      raw = raw.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comentários
      raw = raw.replace(/^(var|let|const)\s+\w+\s*=\s*/, '');
      raw = raw.replace(/;$/, ''); // Remove ponto e vírgula no final

      // 2. Extrai apenas o que está dentro do objeto principal { ... }
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("Não foi possível encontrar um objeto { } no texto colado.");
      }
      raw = match[0];

      // 3. Regex Robusta para converter Objeto JS em JSON
      // Só coloca aspas em palavras que estão no início da linha ou após vírgula/chave, seguidas de :
      // Isso evita quebrar o appId "1:144..." pois os : internos não estão no início da chave.
      const formattedJson = raw
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*):/g, '$1"$2"$3:') // Coloca aspas nas chaves
        .replace(/'/g, '"') // Troca aspas simples por duplas
        .replace(/,\s*}/g, '}'); // Remove vírgula trailing

      const config = JSON.parse(formattedJson);
      
      if (config.apiKey && config.projectId) {
        localStorage.setItem('firebase_manual_config', JSON.stringify(config));
        alert("Configuração salva! O app será reiniciado.");
        // Força recarregamento limpo
        window.location.href = window.location.origin + window.location.pathname + (window.location.hash || '');
      } else {
        alert("O código colado não parece ter 'apiKey' ou 'projectId'.");
      }
    } catch (e: any) {
      console.error("Erro no Parse:", e);
      alert("Erro ao ler os dados: " + e.message + "\n\nTente colar apenas o que está entre as chaves { ... }");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError(null);
    try {
      const nextStep = await authService.checkEmailStatus(email);
      setStep(nextStep);
    } catch (err: any) {
      setError({
          title: 'Erro',
          message: 'Certifique-se de que o Firebase está conectado e as regras do Firestore permitem leitura.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.login(email, password);
      login(user);
      navigate('/admin');
    } catch (err: any) {
      setError({ title: 'Acesso Negado', message: 'E-mail ou senha incorretos.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!configStatus.isValid || forceSetup) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-indigo-600 p-10 text-white space-y-6">
            <div className="p-3 bg-white/20 w-fit rounded-xl"><Database size={24} /></div>
            <h2 className="text-3xl font-black">Conectar Firebase</h2>
            <p className="text-indigo-100 text-sm">Cole as configurações do seu projeto para ativar o banco de dados real.</p>
            <div className="space-y-3 pt-4">
               <div className="flex items-start gap-3 text-[10px] bg-black/10 p-3 rounded-lg uppercase font-bold tracking-wider">
                  <ChevronRight size={14} className="shrink-0" />
                  <span>Firebase Console > Settings > Web App > firebaseConfig</span>
               </div>
            </div>
            {forceSetup && (
                <button onClick={() => setForceSetup(false)} className="mt-8 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100">Cancelar</button>
            )}
          </div>
          <div className="md:w-1/2 p-10 flex flex-col justify-center space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Configuração (SDK Setup)</label>
                <textarea 
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={`const firebaseConfig = { \n  apiKey: "...", \n  projectId: "..." \n};`}
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-indigo-50 outline-none resize-none"
                />
            </div>
            <button 
              onClick={handleManualConfigSave}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <ClipboardCheck size={18} /> Salvar e Iniciar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
        <div className="text-center space-y-2">
            <div className="mx-auto h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Sparkles size={32} /></div>
            <h2 className="text-2xl font-black text-slate-900">Portal Admin</h2>
            <p className="text-sm text-slate-400">Gerencie seu ecossistema IA.</p>
        </div>

        {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={16} /> {error.message}
            </div>
        )}

        {step === AuthStep.EMAIL ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all shadow-inner" />
                <button disabled={isLoading} className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2" style={{ backgroundColor: theme.primaryColor }}>
                    {isLoading ? <RefreshCw className="animate-spin" size={16}/> : 'Próximo'}
                </button>
            </form>
        ) : (
            <form onSubmit={handleLogin} className="space-y-4">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all shadow-inner" />
                <button disabled={isLoading} className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2" style={{ backgroundColor: theme.primaryColor }}>
                    {isLoading ? <RefreshCw className="animate-spin" size={16}/> : 'Entrar'}
                </button>
            </form>
        )}

        <div className="pt-4 border-t border-slate-50 text-center">
            <button onClick={() => setForceSetup(true)} className="text-[10px] font-black uppercase text-slate-300 hover:text-indigo-600 transition-colors tracking-widest flex items-center justify-center gap-2 mx-auto">
                <Settings size={12} /> Redefinir Conexão
            </button>
        </div>
      </div>
    </div>
  );
};
