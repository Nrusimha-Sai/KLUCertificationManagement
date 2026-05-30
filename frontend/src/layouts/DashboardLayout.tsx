import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  ChevronRight,
  Wifi,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore, type Notification } from '@/store/uiStore';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Students', href: '/admin/students', icon: Users },
];

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Certifications', href: '/student/certifications', icon: Award },
];

function NotificationToast() {
  const { notifications, removeNotification } = useUIStore();

  const TYPE_STYLES: Record<Notification['type'], string> = {
    success: 'border-green-500/30 bg-green-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
  };

  const DOT_STYLES: Record<Notification['type'], string> = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    info: 'bg-blue-400',
    warning: 'bg-yellow-400',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={cn(
              'glass rounded-xl p-4 border pointer-events-auto cursor-pointer',
              TYPE_STYLES[notif.type]
            )}
            onClick={() => removeNotification(notif.id)}
          >
            <div className="flex items-start gap-3">
              <div className={cn('w-2 h-2 rounded-full mt-1 shrink-0', DOT_STYLES[notif.type])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{notif.title}</p>
                {notif.message && (
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{notif.message}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, pendingCount, activeUsers } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === 'ADMIN' ? ADMIN_NAV : STUDENT_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ isMobile = false }) => (
    <div
      className={cn(
        'flex flex-col h-full bg-white/[0.02] backdrop-blur-xl',
        isMobile ? 'w-64' : sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center p-5 border-b border-white/5', (!sidebarOpen && !isMobile) && 'justify-center')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-white/10 to-white/20 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {(sidebarOpen || isMobile) && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-3 font-extrabold text-white text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70 whitespace-nowrap overflow-hidden"
            >
              KLU Certify
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Role badge */}
      <AnimatePresence>
        {(sidebarOpen || isMobile) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="px-4 pt-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/5 text-white/50 shadow-sm backdrop-blur-md">
              <Wifi className="w-3.5 h-3.5 text-green-400 animate-pulse" />
              {user?.role === 'ADMIN' ? 'Administrator' : 'Student'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 mt-2 select-none">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href + item.label}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative',
                isActive
                  ? 'text-white font-bold'
                  : 'text-white/50 hover:text-white',
                (!sidebarOpen && !isMobile) && 'justify-center px-2'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-highlight"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-glass-inner z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className={cn('w-4.5 h-4.5 shrink-0 z-10 transition-transform duration-200 group-hover:scale-110', isActive ? 'text-white' : 'text-current')} />
              <AnimatePresence>
                {(sidebarOpen || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="whitespace-nowrap overflow-hidden z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.label === 'Dashboard' && user?.role === 'ADMIN' && pendingCount > 0 && (sidebarOpen || isMobile) && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-yellow-400 text-klu-darker font-extrabold rounded-full min-w-[22px] text-center z-10 shadow-sm animate-pulse">
                  {pendingCount}
                </span>
              )}
              {isActive && (sidebarOpen || isMobile) && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0 z-10 text-white/40" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/5 bg-white/[0.01]">
        <div className={cn('flex items-center gap-3', (!sidebarOpen && !isMobile) && 'justify-center')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-inner border border-white/10">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <AnimatePresence>
            {(sidebarOpen || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-white/40 truncate mt-0.5">
                  {user?.universityId}
                  {user?.dept && ` · ${user.dept}`}
                </p>
                {user?.email && (
                  <p className="text-[9px] text-white/30 truncate" title={user.email}>
                    {user.email}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleLogout}
            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all shrink-0 shadow-sm"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-klu-darker overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 80 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col glass border-r border-white/5 overflow-hidden shrink-0"
      >
        <Sidebar />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed left-0 top-0 h-full z-50 glass border-r border-white/10 lg:hidden flex flex-col"
            >
              <Sidebar isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 glass shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleSidebar()}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all hidden lg:block"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span>{activeUsers} online</span>
              </div>
            )}
            {user?.role === 'ADMIN' && pendingCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                <Bell className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-semibold">{pendingCount} pending</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Toast Notifications */}
      <NotificationToast />
    </div>
  );
}
