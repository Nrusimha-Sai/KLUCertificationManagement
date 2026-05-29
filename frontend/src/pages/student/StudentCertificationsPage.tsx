import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Search,
  ExternalLink,
  Plus,
  Loader2,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { studentApi } from '@/api';
import { useUIStore } from '@/store/uiStore';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { SubmitCertificationRequest, Course, Certification } from '@/types';
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

function SubmitModal({
  isOpen,
  onClose,
  defaultCourseCode = '',
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseCode?: string;
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
  } = useForm<SubmitForm>({
    resolver: zodResolver(submitSchema),
    values: {
      courseCode: defaultCourseCode,
      credlyLink: '',
    },
  });

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
                disabled={!!defaultCourseCode}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all disabled:opacity-60"
              >
                <option value="" className="bg-klu-darker">Select a course…</option>
                {courses.map((c) => (
                  <option key={c.courseCode} value={c.courseCode} className="bg-klu-darker">
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

export default function StudentCertificationsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, APPROVED, PENDING, NOT_SUBMITTED
  const [sortBy, setSortBy] = useState('CODE'); // CODE, TITLE
  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: studentApi.getCourses,
    staleTime: 10 * 60 * 1000,
  });

  const { data: certifications = [], isLoading: certsLoading } = useQuery({
    queryKey: ['student-certifications'],
    queryFn: studentApi.getMyCertifications,
    refetchInterval: 30000,
  });

  const handleOpenSubmit = (courseCode: string) => {
    setSelectedCourseCode(courseCode);
    setIsModalOpen(true);
  };

  const getCourseStatus = (courseCode: string) => {
    const cert = certifications.find((c) => c.courseCode === courseCode);
    if (!cert) return { type: 'NOT_SUBMITTED', label: 'Not Submitted', cert: null };
    if (cert.status === 'APPROVED') return { type: 'APPROVED', label: 'Approved', cert };
    return { type: 'PENDING', label: 'Pending Review', cert };
  };

  // Filter & Sort
  const processedCourses = courses
    .map((course) => {
      const statusInfo = getCourseStatus(course.courseCode);
      return { ...course, statusInfo };
    })
    .filter((course) => {
      // Search filter
      const matchesSearch =
        course.courseCode.toLowerCase().includes(search.toLowerCase()) ||
        course.courseTitle.toLowerCase().includes(search.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'ALL' || course.statusInfo.type === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'CODE') {
        return a.courseCode.localeCompare(b.courseCode);
      } else {
        return a.courseTitle.localeCompare(b.courseTitle);
      }
    });

  const isLoading = coursesLoading || certsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Course Certifications Catalog</h1>
            <p className="text-white/50 text-sm mt-1">
              View all university courses and submit or track your certification status.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenSubmit('')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-klu-darker font-semibold rounded-xl hover:bg-klu-accent transition-all"
          >
            <Plus className="w-4 h-4" />
            General Submission
          </motion.button>
        </div>

        {/* Filters and Controls */}
        <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search by code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status filters */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              {[
                { value: 'ALL', label: 'All Courses' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'NOT_SUBMITTED', label: 'Not Submitted' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === filter.value
                      ? 'bg-white text-klu-darker shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Sort selectors */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-white/40 mr-1" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs focus:outline-none"
              >
                <option value="CODE" className="bg-klu-darker">Sort by Code</option>
                <option value="TITLE" className="bg-klu-darker">Sort by Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Catalog Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-6 space-y-4">
                <div className="shimmer h-4 w-1/3 rounded" />
                <div className="shimmer h-6 w-2/3 rounded" />
                <div className="shimmer h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : processedCourses.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/40 font-medium">No courses found matching your criteria.</p>
            <p className="text-white/30 text-xs mt-1">Try resetting the status filter or search query.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {processedCourses.map((course) => {
                const { statusInfo } = course;
                const isApproved = statusInfo.type === 'APPROVED';
                const isPending = statusInfo.type === 'PENDING';

                return (
                  <motion.div
                    key={course.courseCode}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass rounded-2xl p-5 flex flex-col justify-between hover:bg-white/8 transition-all duration-300 group"
                  >
                    <div>
                      {/* Code and Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 bg-white/10 rounded-md text-xs font-mono text-white/60">
                          {course.courseCode}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                              : isPending
                              ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                              : 'bg-white/5 text-white/40 border border-white/10'
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {isPending && <Clock className="w-2.5 h-2.5 animate-pulse" />}
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Course Title */}
                      <h3 className="font-semibold text-white text-base leading-snug group-hover:text-klu-accent transition-colors">
                        {course.courseTitle}
                      </h3>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                      {isApproved && statusInfo.cert ? (
                        <>
                          <span className="text-[10px] text-white/40">
                            Verified {formatRelativeTime(statusInfo.cert.verifiedAt || '')}
                          </span>
                          <a
                            href={statusInfo.cert.credlyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
                          >
                            View Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      ) : isPending && statusInfo.cert ? (
                        <>
                          <span className="text-[10px] text-white/40">
                            Submitted {formatRelativeTime(statusInfo.cert.submittedAt || '')}
                          </span>
                          <a
                            href={statusInfo.cert.credlyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                          >
                            Track Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-white/30">Not certified yet</span>
                          <button
                            onClick={() => handleOpenSubmit(course.courseCode)}
                            className="text-xs bg-white text-klu-darker hover:bg-klu-accent font-semibold px-3 py-1.5 rounded-lg transition-all"
                          >
                            Submit Verify
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <SubmitModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedCourseCode(''); }}
        defaultCourseCode={selectedCourseCode}
      />
    </DashboardLayout>
  );
}
