import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Bus,
  Shield,
  Car,
  Heart,
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const Login: React.FC = () => {
  const { login, requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Default to expanded for immediate preview ease
  const [isDemoCredentialsExpanded, setIsDemoCredentialsExpanded] = useState(true);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const demoAccounts = [
    {
      role: 'School Bus Driver',
      name: 'K. Murugesan',
      designation: 'Driver for Bus #01 (TN 38 BE 4011)',
      email: 'driver.murugesan@kovaivalley.edu.in',
      pass: 'driver@123',
      icon: Car,
      accent: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
    },
    {
      role: 'Administrator',
      name: 'Thiru. S. Ramanathan',
      designation: 'Principal & Transport Director',
      email: 'admin@kovaivalley.edu.in',
      pass: 'admin@123',
      icon: Shield,
      accent: 'border-blue-200 bg-blue-50/70 text-blue-900',
    },
    {
      role: 'Parent',
      name: 'Priya R',
      designation: 'Mother of 4 Enrolled Children',
      email: 'parent.priya@kovaivalley.edu.in',
      pass: 'parent@123',
      icon: Heart,
      accent: 'border-amber-200 bg-amber-50/70 text-amber-900',
    },
    {
      role: 'Student',
      name: 'Arjun Kumar',
      designation: 'Class 7-A (Bus #01, Peelamedu)',
      email: 'student.arjun@kovaivalley.edu.in',
      pass: 'student@123',
      icon: GraduationCap,
      accent: 'border-sky-200 bg-sky-50/70 text-sky-900',
    },
  ];

  const handleFillDemo = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage('');
  };

  const handleQuickLogin = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage('');
    setIsLoading(true);
    setTimeout(() => {
      const res = login(accEmail, accPass);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Login failed');
      }
    }, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your school registered email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid email or password.');
      }
    }, 350);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotFeedback({ type: 'error', text: 'Enter your registered email address.' });
      return;
    }
    const res = requestPasswordReset(forgotEmail);
    if (res.success) {
      setForgotFeedback({ type: 'success', text: res.message });
    } else {
      setForgotFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-4 sm:py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-800 text-white shadow-xl shadow-blue-500/20 mb-2 ring-4 ring-white/10">
          <Bus className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Kovai Valley Matriculation School
        </h1>
        <p className="text-[11px] text-sky-300 font-medium flex items-center justify-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" />
          Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          SmartRoute – Automated School Transport Management System
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white py-6 px-5 shadow-2xl rounded-2xl sm:px-8 border border-slate-200">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Sign In to Transport Portal</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your authorized school credentials to access your dashboard.
            </p>
          </div>

          {/* 1-Click Fast Preview Bar */}
          <div className="mb-4 p-3 bg-blue-50/90 rounded-xl border border-blue-200">
            <span className="text-[11px] font-bold text-blue-900 block mb-1.5 flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-blue-600" />
              <span>Instant 1-Click Demo Login (Explore App):</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('driver.murugesan@kovaivalley.edu.in', 'driver@123')}
                disabled={isLoading}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
              >
                <span>🚌 Driver Portal</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@kovaivalley.edu.in', 'admin@123')}
                disabled={isLoading}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
              >
                <span>🛡️ Admin Portal</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('parent.priya@kovaivalley.edu.in', 'parent@123')}
                disabled={isLoading}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
              >
                <span>👨‍👩‍👧 Parent Portal</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('student.arjun@kovaivalley.edu.in', 'student@123')}
                disabled={isLoading}
                className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
              >
                <span>🎓 Student Portal</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Email Address
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="e.g. admin@kovaivalley.edu.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-slate-600">Remember session</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotFeedback(null);
                  setIsForgotModalOpen(true);
                }}
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating with Kovai Valley Transport...</span>
              ) : (
                <>
                  <span>Sign In to SmartRoute</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Small Expandable Demo Credentials Section */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDemoCredentialsExpanded(!isDemoCredentialsExpanded)}
              className="w-full flex items-center justify-between py-1 text-xs font-bold text-slate-600 uppercase tracking-wider hover:text-slate-900 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                Demo Login Credentials (Coimbatore System)
              </span>
              {isDemoCredentialsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isDemoCredentialsExpanded && (
              <div className="mt-3 space-y-2 animate-in fade-in">
                <p className="text-[11px] text-slate-500 mb-2">
                  Click <strong>"Fill"</strong> to load credentials into the form, then press <strong>Sign In</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoAccounts.map(acc => {
                    const Icon = acc.icon;
                    return (
                      <div
                        key={acc.role}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white transition-all flex flex-col justify-between text-xs"
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 block truncate">
                              {acc.role}: {acc.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {acc.email}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              Password: {acc.pass}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickLogin(acc.email, acc.pass)}
                            disabled={isLoading}
                            className="flex-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 py-1.5 px-2 rounded-md text-center transition-colors shadow-2xs cursor-pointer"
                          >
                            Sign In
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFillDemo(acc.email, acc.pass)}
                            className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 py-1.5 px-2 rounded-md text-center transition-colors cursor-pointer"
                          >
                            Fill
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Kovai Valley Matriculation School • Transport Cell • Tamil Nadu, India</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="Enter your verified Kovai Valley school email to receive recovery instructions."
        maxWidth="md"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered School Email
            </label>
            <input
              type="email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. parent.priya@kovaivalley.edu.in"
              required
            />
          </div>

          {forgotFeedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                forgotFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {forgotFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{forgotFeedback.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
