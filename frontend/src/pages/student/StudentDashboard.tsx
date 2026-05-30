import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Clock,
  CheckCircle2,
  Plus,
  ExternalLink,
  Loader2,
  AlertCircle,
  BookOpen,
  XCircle,
  Trash2,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { studentApi } from '@/api';
import { useUIStore } from '@/store/uiStore';
import { formatDate, formatRelativeTime, debounce } from '@/lib/utils';
import type { SubmitCertificationRequest, Certification } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/layouts/DashboardLayout';

const submitSchema = z.object({
  courseCode: z.string().min(1, 'Please select a course'),
  credlyLink: z
    .string()
    .min(1, 'Verification link is required')
    .refine(
      (val) => {
        try {
          const withProto = val.match(/^https?:\/\//i) ? val : `https://${val}`;
          new URL(withProto);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Must be a valid URL link' }
    ),
});

type SubmitForm = z.infer<typeof submitSchema>;

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Review',
    className: 'badge-pending',
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    className: 'badge-approved',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    className: 'badge-rejected bg-red-400/10 border-red-400/20 text-red-400 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
    icon: XCircle,
  },
};

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="shimmer h-4 w-1/3 rounded" />
      <div className="shimmer h-3 w-2/3 rounded" />
      <div className="shimmer h-3 w-1/2 rounded" />
    </div>
  );
}

function SubmitModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  const { data: courses = [] } = useQuery({
    queryKey: ['student-courses'],
    queryFn: studentApi.getCourses,
    staleTime: 10 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitForm>({ resolver: zodResolver(submitSchema) });

  const submitMutation = useMutation({
    mutationFn: studentApi.submitCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
      addNotification({
        type: 'success',
        title: 'Request Submitted!',
        message: 'Your certification is now pending admin review.',
      });
      reset();
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: err.response?.data?.message || 'Please try again.',
      });
    },
  });

  const onSubmit = (data: SubmitForm) => {
    const formattedData = {
      ...data,
      credlyLink: data.credlyLink.match(/^https?:\/\//i)
        ? data.credlyLink
        : `https://${data.credlyLink}`,
    };
    submitMutation.mutate(formattedData as SubmitCertificationRequest);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass rounded-3xl p-6 sm:p-8 shadow-glass-lg max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-xl font-bold text-white mb-1">Submit Certification</h2>
          <p className="text-white/50 text-sm mb-6">
            Select your course and paste your certification verification link.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Course
              </label>
              <select
                {...register('courseCode')}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              >
                <option value="" className="bg-klu-darker">Select a course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.courseCode} className="bg-klu-darker">
                    {c.courseCode} — {c.courseTitle}
                  </option>
                ))}
              </select>
              {errors.courseCode && (
                <p className="mt-1.5 text-xs text-red-400">{errors.courseCode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Certification Verification Link
              </label>
              <input
                {...register('credlyLink')}
                type="url"
                placeholder="https://example.com/my-certification-link"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              />
              {errors.credlyLink && (
                <p className="mt-1.5 text-xs text-red-400">{errors.credlyLink.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={submitMutation.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-white text-klu-darker font-bold rounded-xl hover:bg-klu-accent transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                ) : (
                  'Submit Request'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function CertCard({ cert }: { cert: Certification }) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const config = STATUS_CONFIG[cert.status];
  const StatusIcon = config?.icon || Clock;

  const deleteMutation = useMutation({
    mutationFn: () => studentApi.deleteRejectedCertification(cert.courseCode),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Certification deleted',
        message: 'Rejected request has been permanently deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: (err: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion failed',
        message: err.response?.data?.message || 'Failed to delete request.',
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Delete rejected certification for ${cert.courseTitle}?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 hover:bg-white/8 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-white">{cert.courseTitle}</p>
          <p className="text-xs text-white/40 mt-0.5">{cert.courseCode}</p>
        </div>
        <span className={config?.className || 'badge-pending'}>
          <StatusIcon className="w-3 h-3" />
          {config?.label || 'Pending'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">
          {cert.status === 'APPROVED' && cert.verifiedAt
            ? `Verified ${formatRelativeTime(cert.verifiedAt)}`
            : cert.status === 'REJECTED' && cert.verifiedAt
            ? `Rejected ${formatRelativeTime(cert.verifiedAt)}`
            : `Submitted ${formatRelativeTime(cert.submittedAt)}`}
        </span>
        <div className="flex items-center gap-4">
          <a
            href={cert.credlyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
          >
            View Certificate <ExternalLink className="w-3 h-3" />
          </a>
          {cert.status === 'REJECTED' && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Delete request"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['student-certifications'],
    queryFn: studentApi.getMyCertifications,
    refetchInterval: 30000,
  });

  const pending = certifications.filter((c) => c.status === 'PENDING');
  const approved = certifications.filter((c) => c.status === 'APPROVED');
  const rejected = certifications.filter((c) => c.status === 'REJECTED');

  const debouncedSearch = useCallback(
    debounce((val: string) => {
      setSearch(val);
    }, 400),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleStudentExport = async () => {
    setIsExporting(true);
    try {
      const blob = await studentApi.exportMyCertifications();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-certifications-${user?.universityId}-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      addNotification({
        type: 'success',
        title: 'Export successful!',
        message: 'Your certifications portfolio has been exported to Excel.',
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Export failed',
        message: 'Could not export your portfolio to Excel. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCertifications = useMemo(() => {
    return certifications.filter((cert) => {
      if (statusFilter !== 'ALL' && cert.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const codeMatch = cert.courseCode.toLowerCase().includes(query);
        const titleMatch = cert.courseTitle.toLowerCase().includes(query);
        return codeMatch || titleMatch;
      }
      return true;
    });
  }, [certifications, search, statusFilter]);

  const pieData = useMemo(() => {
    return [
      { name: 'Approved', value: approved.length },
      { name: 'Pending', value: pending.length },
      { name: 'Rejected', value: rejected.length },
    ].filter((item) => item.value > 0);
  }, [approved, pending, rejected]);

  const PIE_COLORS = ['#34d399', '#facc15', '#f87171'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Good morning, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {user?.universityId}{user?.dept ? ` · ${user.dept}` : ''} · Student Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStudentExport}
              disabled={isExporting || certifications.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/10 text-white/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl text-sm transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Portfolio
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-klu-darker font-semibold rounded-xl text-sm hover:bg-klu-accent transition-all"
            >
              <Plus className="w-4 h-4" />
              Submit Certification
            </motion.button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Certifications', value: certifications.length, icon: BookOpen, color: 'text-white' },
            { label: 'Approved', value: approved.length, icon: Award, color: 'text-green-400' },
            { label: 'Pending Review', value: pending.length, icon: Clock, color: 'text-yellow-400' },
            { label: 'Rejected', value: rejected.length, icon: XCircle, color: 'text-red-400' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 text-center"
            >
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart / Analytics Column */}
          <div className="glass rounded-2xl p-6 flex flex-col justify-between min-h-[360px]">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Portfolio Analytics</h2>
              <p className="text-xs text-white/40 mb-5">Status distribution breakdown</p>
            </div>
            {certifications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Award className="w-10 h-10 text-white/10 mb-2" />
                <p className="text-xs text-white/30">No data available yet</p>
              </div>
            ) : (
              <>
                <div className="flex-1 min-h-[160px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => {
                          const originalIndex = ['Approved', 'Pending', 'Rejected'].indexOf(entry.name);
                          return (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[originalIndex >= 0 ? originalIndex : 0]} />
                          );
                        })}
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
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  {[
                    { name: 'Approved', value: approved.length, color: '#34d399' },
                    { name: 'Pending', value: pending.length, color: '#facc15' },
                    { name: 'Rejected', value: rejected.length, color: '#f87171' },
                  ].map((data) => (
                    <div key={data.name} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                        <span className="text-white/70 font-medium">{data.name}</span>
                      </div>
                      <span className="text-white font-bold">
                        {data.value} ({certifications.length ? Math.round((data.value / certifications.length) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Certifications Search, Filter & List Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleSearchChange}
                  placeholder="Search by course code or title…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-white/30" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer"
                >
                  <option value="ALL" className="bg-klu-darker">All Statuses</option>
                  <option value="APPROVED" className="bg-klu-darker">Approved</option>
                  <option value="PENDING" className="bg-klu-darker">Pending Review</option>
                  <option value="REJECTED" className="bg-klu-darker">Rejected</option>
                </select>
              </div>
            </div>

            {/* List of certifications */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : filteredCertifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-2xl p-12 text-center"
                >
                  <Award className="w-12 h-12 mx-auto mb-4 text-white/20" />
                  <p className="text-white/40">No matching certifications found.</p>
                  {certifications.length === 0 ? (
                    <>
                      <p className="text-white/30 text-sm mt-1">Submit your first certification to get started.</p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 px-5 py-2.5 bg-white text-klu-darker font-semibold rounded-xl text-sm hover:bg-klu-accent transition-all"
                      >
                        Submit Certification
                      </button>
                    </>
                  ) : (
                    <p className="text-white/30 text-sm mt-1">Try adjusting your search query or status filter.</p>
                  )}
                </motion.div>
              ) : (
                <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {filteredCertifications.map((cert) => (
                      <CertCard key={cert.id} cert={cert} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SubmitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </DashboardLayout>
  );
}
