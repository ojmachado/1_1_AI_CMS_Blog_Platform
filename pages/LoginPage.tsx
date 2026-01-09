
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
  Settings,
  ShieldCheck,
  FileCode
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
      raw = raw.replace(/\/\/.*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
      raw = raw.replace(/^(var|let|const)\s+\w+\s*=\s*/, '').replace(/;$/, '');

      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Não foi possível encontrar um objeto { } no texto colado.");
      raw = match[0];

      const formattedJson = raw
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*):/g, '$1"$2"$3:')
        .replace(/'/g, '"')
        .replace(/,\s*}/g, '}');

      const config = JSON.parse(formattedJson);
      
      if (config.apiKey && config.projectId) {
        localStorage.setItem('firebase_manual_config', JSON.stringify(config));
        alert("Configuração salva! O app será reiniciado.");
        window.location.href = window.location.origin + window.location.pathname;
      } else {
        alert("O código colado não parece ter 'apiKey' ou 'projectId'.");
      }
    } catch (e: any) {
      alert("Erro ao ler os dados: " + e.message);
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
        <div className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-2/5 bg-indigo-600 p-10 text-white space-y-8">
            <div className="p-3 bg-white/20 w-fit rounded-xl"><Database size={24} /></div>
            <div>
                <h2 className="text-3xl font-black">Conectar Firebase</h2>
                <p className="text-indigo-100 text-sm mt-2 opacity-80">Ative seu banco de dados e armazenamento de imagens.</p>
            </div>
            
            <div className="space-y-6 pt-4 border-t border-white/10">
               <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <ShieldCheck size={14} /> Dica de Segurança
                  </h4>
                  <p className="text-[11px] leading-relaxed text-indigo-100 bg-black/10 p-4 rounded-2xl border border-white/5">
                    Para o sistema salvar <strong>posts</strong> e <strong>imagens</strong>, você DEVE ir no Firebase Console e mudar as abas <strong>Rules</strong> do Firestore e do Storage para: <br/><br/>
                    <code className="bg-white/10 p-1 rounded font-mono text-white">allow read, write: if true;</code>
                  </p>
               </div>

               <div className="flex items-start gap-3 text-[10px] bg-black/10 p-3 rounded-lg uppercase font-bold tracking-wider">
                  <ChevronRight size={14} className="shrink-0" />
                  <span>Configurações do Projeto > Web App > firebaseConfig</span>
               </div>
            </div>
            {forceSetup && (
                <button onClick={() => setForceSetup(false)} className="mt-8 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100">Cancelar</button>
            )}
          </div>
          <div className="md:w-3/5 p-10 flex flex-col justify-center space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Configuração (SDK Setup)</label>
                <textarea 
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={`const firebaseConfig = { \n  apiKey: "...", \n  projectId: "...", \n  storageBucket: "..." \n};`}
                    className="w-full h-56 p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-xs font-mono focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none shadow-inner"
                />
            </div>
            <button 
              onClick={handleManualConfigSave}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
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
            <p className="text-sm text-slate-400 font-medium">Gerencie seu ecossistema IA.</p>
        </div>

        {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-xs font-bold flex items-center gap-2 animate-in shake duration-300">
                <AlertTriangle size={16} /> {error.message}
            </div>
        )}

        {step === AuthStep.EMAIL ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all shadow-inner" />
                <button disabled={isLoading} className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg" style={{ backgroundColor: theme.primaryColor }}>
                    {isLoading ? <RefreshCw className="animate-spin" size={16}/> : 'Próximo'}
                </button>
            </form>
        ) : (
            <form onSubmit={handleLogin} className="space-y-4">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all shadow-inner" />
                <button disabled={isLoading} className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg" style={{ backgroundColor: theme.primaryColor }}>
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
