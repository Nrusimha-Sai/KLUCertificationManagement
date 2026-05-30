import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Award,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  RefreshCw,
  BarChart3,
  Wifi,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminApi } from '@/api';
import { useUIStore } from '@/store/uiStore';
import { debounce, formatDate } from '@/lib/utils';
import type { Certification } from '@/types';
import DashboardLayout from '@/layouts/DashboardLayout';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

function StatCard({
  title,
  value,
  icon: Icon,
  delta,
  color = 'text-white',
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  delta?: string;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 group hover:bg-white/8 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {delta && (
          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
            {delta}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-sm text-white/50">{title}</div>
    </motion.div>
  );
}

function CertificationRow({
  cert,
  onApprove,
  onReject,
}: {
  cert: Certification;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    onApprove(cert.id);
    setTimeout(() => setIsProcessing(false), 1000);
  };

  const handleReject = async () => {
    if (!window.confirm(`Reject certification from ${cert.studentName}?`)) return;
    setIsProcessing(true);
    onReject(cert.id);
    setTimeout(() => setIsProcessing(false), 1000);
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-white/5 hover:bg-white/5 transition-colors"
    >
      <td className="px-4 py-3 text-sm text-white/80">{cert.universityId}</td>
      <td className="px-4 py-3 text-sm text-white">{cert.studentName}</td>
      <td className="px-4 py-3">
        <span className="text-xs text-white/60">{cert.courseCode}</span>
        <p className="text-sm text-white/80 mt-0.5">{cert.courseTitle}</p>
      </td>
      <td className="px-4 py-3">
        <span
          className={
            cert.status === 'APPROVED'
              ? 'badge-approved'
              : cert.status === 'REJECTED'
              ? 'badge-rejected bg-red-400/10 border border-red-400/20 text-red-400 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold'
              : 'badge-pending'
          }
        >
          {cert.status === 'APPROVED' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : cert.status === 'REJECTED' ? (
            <XCircle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {cert.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-white/40">{formatDate(cert.submittedAt)}</td>
      <td className="px-4 py-3">
        <a
          href={cert.credlyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/40 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </td>
      <td className="px-4 py-3">
        {cert.status === 'PENDING' && (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleApprove}
              disabled={isProcessing}
              className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-all disabled:opacity-50"
              title="Approve"
            >
              <CheckCircle2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleReject}
              disabled={isProcessing}
              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </motion.button>
          </div>
        )}
        {cert.status === 'APPROVED' && (
          <CheckCircle2 className="w-4 h-4 text-green-400/40" />
        )}
        {cert.status === 'REJECTED' && (
          <XCircle className="w-4 h-4 text-red-400/40" />
        )}
      </td>
    </motion.tr>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { addNotification, pendingCount, activeUsers } = useUIStore();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: adminApi.getAnalytics,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const { data: certsPage, isLoading: certsLoading } = useQuery({
    queryKey: ['admin-certifications', query, statusFilter, page],
    queryFn: () =>
      adminApi.getCertifications({
        query: query || undefined,
        status: statusFilter || undefined,
        page,
        size: pageSize,
      }),
    staleTime: 30 * 1000,
  });

  const debouncedSearch = useCallback(
    debounce((val: string) => {
      setQuery(val);
      setPage(0);
    }, 400),
    []
  );

  const approveMutation = useMutation({
    mutationFn: adminApi.approveCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['course-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
      addNotification({ type: 'success', title: 'Certification Approved' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to approve',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: adminApi.rejectCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['course-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
      addNotification({ type: 'info', title: 'Certification Rejected', message: 'Removed from system.' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to reject',
      });
    },
  });

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportCertifications();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klu-certifications-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      addNotification({ type: 'success', title: 'Export Downloaded', message: 'Excel file saved.' });
    } catch {
      addNotification({ type: 'error', title: 'Export Failed' });
    }
  };

  const pieData = analytics
    ? [
        { name: 'Approved', value: analytics.approvedCertifications },
        { name: 'Pending', value: analytics.pendingRequests },
        { name: 'Rejected', value: analytics.rejectedCertifications || 0 },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">
              Real-time certification management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/20">
              <Wifi className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-green-400">{activeUsers} online</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-xl text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              onClick={() => refetchAnalytics()}
              className="p-2 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Students"
            value={analytics?.totalStudents ?? '—'}
            icon={Users}
            color="text-blue-400"
          />
          <StatCard
            title="Total Certifications"
            value={analytics?.totalCertifications ?? '—'}
            icon={Award}
            color="text-purple-400"
          />
          <StatCard
            title="Pending Reviews"
            value={pendingCount || analytics?.pendingRequests || 0}
            icon={Clock}
            color="text-yellow-400"
          />
          <StatCard
            title="Rejected Certifications"
            value={analytics?.rejectedCertifications ?? '0'}
            icon={XCircle}
            color="text-red-400"
          />
          <StatCard
            title="Approval Rate"
            value={analytics ? `${analytics.approvalRate}%` : '—'}
            icon={TrendingUp}
            color="text-green-400"
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Course Popularity Bar Chart */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-white/60" />
              <h2 className="font-semibold text-white">Course Popularity</h2>
            </div>
            {analyticsLoading ? (
              <div className="h-48 shimmer rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={analytics?.coursePopularity?.map((c) => ({
                    name: c.courseCode,
                    count: c.count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" fill="#ffffff" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status Pie */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-5">Status Breakdown</h2>
            {analyticsLoading ? (
              <div className="h-48 shimmer rounded-xl" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="text-xs text-white/50">Approved ({analytics?.approvedCertifications})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="text-xs text-white/50">Pending ({analytics?.pendingRequests})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="text-xs text-white/50">Rejected ({analytics?.rejectedCertifications || 0})</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Certifications Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search students, courses..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/30" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="" className="bg-klu-darker">All Status</option>
                <option value="PENDING" className="bg-klu-darker">Pending</option>
                <option value="APPROVED" className="bg-klu-darker">Approved</option>
                <option value="REJECTED" className="bg-klu-darker">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['University ID', 'Student', 'Course', 'Status', 'Submitted', 'Certificate', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="shimmer h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : certsPage?.content.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">
                      No certifications found.
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {certsPage?.content.map((cert) => (
                      <CertificationRow
                        key={cert.id}
                        cert={cert}
                        onApprove={(id) => approveMutation.mutate(id)}
                        onReject={(id) => rejectMutation.mutate(id)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {certsPage && certsPage.totalPages > 1 && (
            <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-white/40">
                {certsPage.totalElements} total results
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={certsPage.first}
                  className="p-1.5 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-white/60">
                  Page {certsPage.number + 1} of {certsPage.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={certsPage.last}
                  className="p-1.5 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Students */}
        {analytics?.topStudents && analytics.topStudents.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-5">🏆 Top Certified Students</h2>
            <div className="space-y-3">
              {analytics.topStudents.slice(0, 5).map((student, i) => (
                <div key={student.universityId} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{student.studentName}</p>
                    <p className="text-xs text-white/40">{student.universityId}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-sm font-semibold text-white">
                      {student.certificationCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
