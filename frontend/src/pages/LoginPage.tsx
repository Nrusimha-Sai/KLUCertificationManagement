import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const loginSchema = z.object({
  universityId: z
    .string()
    .min(1, 'University ID is required')
    .max(50, 'University ID too long'),
  securityCode: z
    .string()
    .min(1, 'Security code is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addNotification } = useUIStore();
  const [showCode, setShowCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token);
      addNotification({
        type: 'success',
        title: `Welcome back, ${data.user.name.split(' ')[0]}!`,
        message: `Logged in as ${data.user.role.toLowerCase()}`,
      });
      if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      setErrorMessage(msg);
    },
  });

  const onSubmit = (data: LoginForm) => {
    setErrorMessage('');
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-klu-darker flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-radial from-klu-primary/20 via-transparent to-transparent" />

      {/* Back to home */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 shadow-glass-lg">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4"
            >
              <ShieldCheck className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">KLU Certify</h1>
            <p className="text-white/50 text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Error */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6"
            >
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{errorMessage}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* University ID */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                University ID
              </label>
              <input
                {...register('universityId')}
                type="text"
                placeholder="e.g. 2200030123"
                autoComplete="username"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30
                  focus:outline-none focus:ring-2 focus:ring-white/30 transition-all
                  ${errors.universityId ? 'border-red-500/50' : 'border-white/10'}`}
              />
              {errors.universityId && (
                <p className="mt-1.5 text-xs text-red-400">{errors.universityId.message}</p>
              )}
            </div>

            {/* Security Code */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Security Code
              </label>
              <div className="relative">
                <input
                  {...register('securityCode')}
                  type={showCode ? 'text' : 'password'}
                  placeholder="Enter your security code"
                  autoComplete="current-password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border text-white placeholder-white/30
                    focus:outline-none focus:ring-2 focus:ring-white/30 transition-all
                    ${errors.securityCode ? 'border-red-500/50' : 'border-white/10'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.securityCode && (
                <p className="mt-1.5 text-xs text-red-400">{errors.securityCode.message}</p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loginMutation.isPending}
              whileHover={{ scale: loginMutation.isPending ? 1 : 1.02 }}
              whileTap={{ scale: loginMutation.isPending ? 1 : 0.98 }}
              className="w-full py-3.5 bg-white text-klu-darker font-bold rounded-xl
                hover:bg-klu-accent transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-white/30 mt-6">
            Contact your administrator if you're having trouble signing in.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
