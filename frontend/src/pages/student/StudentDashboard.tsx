import { useState, lazy, Suspense } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { studentApi } from '@/api';
import { useUIStore } from '@/store/uiStore';
import { formatDate, formatRelativeTime } from '@/lib/utils';
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
  const config = STATUS_CONFIG[cert.status];
  const StatusIcon = config.icon;

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
        <span className={config.className}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">
          {cert.status === 'APPROVED' && cert.verifiedAt
            ? `Verified ${formatRelativeTime(cert.verifiedAt)}`
            : `Submitted ${formatRelativeTime(cert.submittedAt)}`}
        </span>
        <a
          href={cert.credlyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
        >
          View Certificate <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['student-certifications'],
    queryFn: studentApi.getMyCertifications,
    refetchInterval: 30000,
  });

  const pending = certifications.filter((c) => c.status === 'PENDING');
  const approved = certifications.filter((c) => c.status === 'APPROVED');

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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-klu-darker font-semibold rounded-xl hover:bg-klu-accent transition-all"
          >
            <Plus className="w-4 h-4" />
            Submit Certification
          </motion.button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: certifications.length, icon: BookOpen, color: 'text-white' },
            { label: 'Pending', value: pending.length, icon: Clock, color: 'text-yellow-400' },
            { label: 'Approved', value: approved.length, icon: Award, color: 'text-green-400' },
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

        {/* Certifications */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">My Certifications</h2>
          {isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : certifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <Award className="w-12 h-12 mx-auto mb-4 text-white/20" />
              <p className="text-white/40">No certifications yet.</p>
              <p className="text-white/30 text-sm mt-1">Submit your first certification to get started.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/15 transition-all"
              >
                Submit Certification
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {certifications.map((cert) => (
                  <CertCard key={cert.id} cert={cert} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <SubmitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </DashboardLayout>
  );
}
