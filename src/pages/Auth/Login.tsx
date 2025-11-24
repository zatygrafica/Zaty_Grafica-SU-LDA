import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, FileText, BarChart3, CheckSquare } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const cards = [
  { icon: Shield, title: 'Gestão centralizada de clientes e pedidos' },
  { icon: FileText, title: 'Controle de faturação, pagamentos e documentos' },
  { icon: BarChart3, title: 'Indicadores para apoio à decisão' },
  { icon: CheckSquare, title: 'Acompanhamento da produção e prazos' },
];

const LoginPage: React.FC = () => {
  const { signIn, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await signIn(email, password);
      navigate(redirectTo, { replace: true });
    } catch {
      // errors are handled in the store state
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0C1424] via-[#0D1C2D] to-[#093A5C] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10 lg:flex-row lg:items-center lg:gap-12">
        <div className="w-full lg:w-1/2 space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-cyan-200">Acesso seguro</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Plataforma interna para controlo total da produção e operações
            </h1>
            <p className="text-base text-slate-200/80">
              Gestão completa da produção gráfica, clientes, pedidos, faturação e controlo financeiro em um
              ambiente seguro e centralizado.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {cards.map(({ icon: Icon, title }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur"
              >
                <div className="rounded-lg bg-cyan-500/15 p-2 text-cyan-200">
                  <Icon size={18} />
                </div>
                <p className="text-sm font-medium text-slate-50">{title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur lg:w-5/12">
          <div className="mb-8 flex flex-col items-center gap-3">
            <img src="/logo.png" alt="Zaty Gráfica" className="h-12 opacity-90" />
            <div className="text-center space-y-1">
              <p className="text-xs uppercase tracking-wide text-cyan-200">Acesso seguro</p>
              <h2 className="text-2xl font-semibold text-white">Entrar no sistema</h2>
              <p className="text-sm text-slate-200/80">
                Use suas credenciais fornecidas pelo administrador.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-100">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <Mail size={18} className="text-slate-200/80" />
                <input
                  type="email"
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
                  placeholder="Insira o seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-100">Palavra-passe</label>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <Lock size={18} className="text-slate-200/80" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
                  placeholder="Insira a sua palavra-passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="text-slate-200/80 transition hover:text-white"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="text-center text-xs text-slate-300">
              Utilize as credenciais fornecidas pelo administrador.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
