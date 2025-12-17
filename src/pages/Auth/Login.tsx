import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, FileText, BarChart3, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import LegalDocumentsDrawer from '../../components/LegalDocumentsDrawer';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { signIn, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/';

  const cards = [
    { icon: Shield, title: t('login.card_management') },
    { icon: FileText, title: t('login.card_billing') },
    { icon: BarChart3, title: t('login.card_indicators') },
    { icon: CheckSquare, title: t('login.card_production') },
  ];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [legalDrawerOpen, setLegalDrawerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<'privacy' | 'terms' | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await signIn(email, password);
    if (result.success) {
      navigate(redirectTo, { replace: true });
    }
    // errors are handled in the store state
  };

  const openLegalDocument = (doc: 'privacy' | 'terms') => {
    setSelectedDocument(doc);
    setLegalDrawerOpen(true);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0C1424] dark:via-[#0D1C2D] dark:to-[#093A5C] text-gray-900 dark:text-white transition-colors duration-300">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex flex-1 flex-col justify-center gap-8 lg:flex-row lg:items-center lg:gap-16">
          {/* Left Section - Info Cards */}
          <div className="w-full space-y-6 lg:w-1/2 lg:space-y-8">
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
                {t('login.platform_title')}
              </h1>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-200/90 sm:text-base">
                {t('login.platform_description')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {cards.map(({ icon: Icon, title }) => (
                <div
                  key={title}
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3.5 backdrop-blur-sm transition-all hover:border-cyan-500/50 dark:hover:border-cyan-500/30 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm hover:shadow-md"
                >
                  <div className="rounded-lg bg-cyan-500/10 dark:bg-cyan-500/15 p-2 text-cyan-600 dark:text-cyan-300 transition-colors group-hover:bg-cyan-500/20 dark:group-hover:bg-cyan-500/25">
                    <Icon size={20} className="sm:h-5 sm:w-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="w-full lg:w-5/12">
            <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur-md sm:p-8">
              <div className="mb-6 flex flex-col items-center gap-2 sm:mb-8 sm:gap-3">
                <img src="/logo.png" alt="Zaty Gráfica" className="h-10 opacity-90 sm:h-12" />
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    {t('login.enter_system')}
                  </h2>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800 dark:text-slate-100">
                    {t('login.email_label')}
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 transition-colors focus-within:border-cyan-500 dark:focus-within:border-cyan-500/50 focus-within:bg-white dark:focus-within:bg-white/10">
                    <Mail size={18} className="text-gray-500 dark:text-slate-300" />
                    <input
                      type="email"
                      className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:outline-none"
                      placeholder={t('login.email_placeholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800 dark:text-slate-100">
                    {t('login.password_label')}
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 transition-colors focus-within:border-cyan-500 dark:focus-within:border-cyan-500/50 focus-within:bg-white dark:focus-within:bg-white/10">
                    <Lock size={18} className="text-gray-500 dark:text-slate-300" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:outline-none"
                      placeholder={t('login.password_placeholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="text-gray-500 dark:text-slate-300 transition-colors hover:text-gray-700 dark:hover:text-white focus:outline-none"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:from-cyan-500 hover:to-blue-500 dark:hover:from-cyan-400 dark:hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0D1C2D] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:from-cyan-600 disabled:hover:to-blue-600 dark:disabled:hover:from-cyan-500 dark:disabled:hover:to-blue-600"
                  disabled={loading}
                >
                  {loading ? t('login.logging_in') : t('login.login_button')}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t border-gray-300 dark:border-white/10 pt-4 sm:pt-6">
          <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-between sm:gap-4">
            <p className="text-xs text-gray-600 dark:text-slate-400">
              © {new Date().getFullYear()} {t('company.name')}. {t('login.footer.all_rights_reserved')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:gap-4">
              <button
                onClick={() => openLegalDocument('privacy')}
                className="text-gray-700 dark:text-slate-300 transition-colors hover:text-cyan-600 dark:hover:text-cyan-200 hover:underline focus:outline-none focus:text-cyan-600 dark:focus:text-cyan-200"
              >
                {t('legal.privacy_policy.title')}
              </button>
              <span className="text-gray-400 dark:text-slate-500">•</span>
              <button
                onClick={() => openLegalDocument('terms')}
                className="text-gray-700 dark:text-slate-300 transition-colors hover:text-cyan-600 dark:hover:text-cyan-200 hover:underline focus:outline-none focus:text-cyan-600 dark:focus:text-cyan-200"
              >
                {t('legal.terms_of_use.title')}
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Legal Documents Drawer */}
      <LegalDocumentsDrawer
        isOpen={legalDrawerOpen}
        onClose={() => setLegalDrawerOpen(false)}
        selectedDocument={selectedDocument}
      />
    </div>
  );
};

export default LoginPage;
