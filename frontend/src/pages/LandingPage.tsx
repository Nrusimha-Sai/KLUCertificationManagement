import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Zap,
  BarChart3,
  ArrowRight,
  Award,
  Users,
  Clock,
  ChevronDown,
} from 'lucide-react';

const ThreeScene = lazy(() => import('@/components/three/ThreeScene'));

const STATS = [
  { value: '2,400+', label: 'Certifications Verified', icon: Award },
  { value: '1,200+', label: 'Active Students', icon: Users },
  { value: '< 24h', label: 'Avg. Review Time', icon: Clock },
  { value: '99.2%', label: 'Accuracy Rate', icon: ShieldCheck },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Real-time Updates',
    description:
      'Instant WebSocket-powered notifications. Know the moment your certification is approved — no page refresh needed.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Credentials',
    description:
      'Credly-integrated verification ensures every certification is authentic and tamper-proof.',
  },
  {
    icon: BarChart3,
    title: 'Enterprise Analytics',
    description:
      'Deep insights into certification trends, student progress, and course popularity for administrators.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.15 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-klu-darker text-white overflow-x-hidden">
      {/* ─── Navigation ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">KLU Certify</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-semibold bg-white text-klu-darker rounded-xl hover:bg-klu-accent transition-all duration-200 hover:scale-105"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* 3D Background */}
        <div className="absolute inset-0 bg-klu-darker">
          <Suspense fallback={null}>
            <ThreeScene />
          </Suspense>
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-klu-darker/40 via-transparent to-klu-darker" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full text-xs font-semibold border border-white/20 bg-white/5 backdrop-blur-sm text-klu-accent">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Real-time Certification Platform — KL University
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-none">
              Certify.{' '}
              <span className="text-gradient">Verify.</span>
              <br />
              Achieve.
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              The enterprise-grade platform for managing and verifying student
              certifications at KL University — with real-time approvals, AI-ready
              analytics, and a seamless student experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-klu-darker font-bold rounded-2xl hover:bg-klu-accent transition-all duration-300 hover:scale-105 hover:shadow-glow-lg"
              >
                Start Verifying
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                Explore Features
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ─── Stats Section ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-klu-darker">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="glass rounded-2xl p-6 text-center group hover:bg-white/10 transition-all duration-300"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-4 text-klu-accent group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-black mb-1 text-gradient">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Features Section ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-klu-darker">
        <div className="max-w-7xl mx-auto">
          <motion.div
            {...fadeUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              Built for{' '}
              <span className="text-gradient">Enterprise</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Every feature is engineered for scale, reliability, and the ultimate
              user experience.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            className="grid md:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="glass-card group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5 group-hover:bg-white/15 transition-colors">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            {...fadeUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 bg-dots"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Ready to get started?
            </h2>
            <p className="text-white/50 text-lg mb-8">
              Log in with your KLU university credentials to begin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-klu-darker font-bold rounded-2xl hover:bg-klu-accent transition-all duration-300 hover:scale-105"
              >
                Student Login
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                Admin Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/40">
              © 2024 KL University — Certification Management Platform
            </span>
          </div>
          <span className="text-xs text-white/30">
            Built with ❤️ for KLU students
          </span>
        </div>
      </footer>
    </div>
  );
}
