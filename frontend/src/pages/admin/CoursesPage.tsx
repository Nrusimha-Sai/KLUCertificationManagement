import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Users,
  Clock,
  CheckCircle2,
  ExternalLink,
  XCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi } from '@/api';
import { useUIStore } from '@/store/uiStore';
import type { Course } from '@/types';
import DashboardLayout from '@/layouts/DashboardLayout';
import { formatDate } from '@/lib/utils';

const courseSchema = z.object({
  courseCode: z.string().min(1).max(20),
  courseTitle: z.string().min(1).max(200),
});
type CourseForm = z.infer<typeof courseSchema>;

function CourseModal({
  isOpen,
  onClose,
  editingCourse,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingCourse?: Course | null;
}) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: editingCourse
      ? { courseCode: editingCourse.courseCode, courseTitle: editingCourse.courseTitle }
      : {},
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addNotification({ type: 'success', title: 'Course Created' });
      reset();
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      addNotification({ type: 'error', title: 'Error', message: err.response?.data?.message }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CourseForm }) =>
      adminApi.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addNotification({ type: 'success', title: 'Course Updated' });
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      addNotification({ type: 'error', title: 'Error', message: err.response?.data?.message }),
  });

  const onSubmit = (data: CourseForm) => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md glass rounded-3xl p-6 sm:p-8 shadow-glass-lg max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-xl font-bold text-white mb-6">
            {editingCourse ? 'Edit Course' : 'Add Course'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Course Code</label>
              <input
                {...register('courseCode')}
                disabled={!!editingCourse}
                placeholder="e.g. CSE201"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
              />
              {errors.courseCode && <p className="mt-1 text-xs text-red-400">{errors.courseCode.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Course Title</label>
              <input
                {...register('courseTitle')}
                placeholder="e.g. Data Structures and Algorithms"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              {errors.courseTitle && <p className="mt-1 text-xs text-red-400">{errors.courseTitle.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 bg-white text-klu-darker font-bold rounded-xl hover:bg-klu-accent transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingCourse ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function CourseRegistrationsModal({
  isOpen,
  onClose,
  course,
}: {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['course-registrations', course?.courseCode],
    queryFn: () => (course ? adminApi.getCourseRegistrations(course.courseCode) : Promise.resolve([])),
    enabled: !!course && isOpen,
    staleTime: 10 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-registrations', course?.courseCode] });
      queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
      addNotification({ type: 'success', title: 'Certification Approved' });
    },
    onError: (err: any) => {
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
      queryClient.invalidateQueries({ queryKey: ['course-registrations', course?.courseCode] });
      queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
      addNotification({ type: 'info', title: 'Certification Rejected', message: 'Removed from system.' });
    },
    onError: (err: any) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to reject',
      });
    },
  });

  const STATUS_BADGES = {
    PENDING: 'badge-pending bg-yellow-400/10 border-yellow-400/20 text-yellow-400',
    APPROVED: 'badge-approved bg-green-400/10 border-green-400/20 text-green-400',
    REJECTED: 'badge-rejected bg-red-400/10 border-red-400/20 text-red-400',
  };

  if (!isOpen || !course) return null;

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
          className="relative w-full max-w-3xl glass rounded-3xl p-6 sm:p-8 shadow-glass-lg max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6 shrink-0">
            <div>
              <span className="px-2.5 py-0.5 bg-white/10 rounded-md text-xs font-mono text-white/60 mb-2 inline-block">
                {course.courseCode}
              </span>
              <h2 className="text-xl font-bold text-white leading-snug">{course.courseTitle}</h2>
              <p className="text-white/50 text-xs mt-1">Student certification requests catalog</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="space-y-4 py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/40" />
                <p className="text-center text-xs text-white/40">Retrieving students...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-12 border border-white/5 bg-white/2 rounded-2xl">
                <Users className="w-10 h-10 mx-auto mb-3 text-white/20" />
                <p className="text-sm text-white/40 font-medium">No registrations yet.</p>
                <p className="text-xs text-white/30 mt-1">Students have not submitted certifications for this course.</p>
              </div>
            ) : (
              <div className="border border-white/5 rounded-2xl overflow-x-auto bg-white/2">
                <table className="w-full text-left text-sm text-white/80 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Student ID</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Submitted</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Certificate</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{reg.universityId}</td>
                        <td className="px-4 py-3 text-white">
                          <p className="font-semibold text-white">{reg.studentName}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            {reg.studentDept ? `${reg.studentDept}` : 'N/A'}
                            {reg.studentEmail ? ` · ${reg.studentEmail}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGES[reg.status] || ''}`}>
                            {reg.status === 'APPROVED' ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : reg.status === 'REJECTED' ? (
                              <XCircle className="w-2.5 h-2.5" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 animate-pulse" />
                            )}
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40">{formatDate(reg.submittedAt)}</td>
                        <td className="px-4 py-3">
                          <a
                            href={reg.credlyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-white/40 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {reg.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => approveMutation.mutate(reg.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                className="p-1 text-green-400 hover:bg-green-400/10 rounded transition-all"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Reject this certification request?")) {
                                    rejectMutation.mutate(reg.id);
                                  }
                                }}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-all"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {reg.status === 'APPROVED' && (
                            <CheckCircle2 className="w-4 h-4 text-green-400/40 ml-auto" />
                          )}
                          {reg.status === 'REJECTED' && (
                            <XCircle className="w-4 h-4 text-red-400/40 ml-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-sm transition-all"
            >
              Close Catalog
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState('');
  const [prefixFilter, setPrefixFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('CODE_ASC');

  // Course registrations modal states
  const [isRegistrationsOpen, setIsRegistrationsOpen] = useState(false);
  const [selectedCourseForRegs, setSelectedCourseForRegs] = useState<Course | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: adminApi.getCourses,
    staleTime: 10 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addNotification({ type: 'info', title: 'Course Deleted' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      addNotification({ type: 'error', title: 'Error', message: err.response?.data?.message }),
  });

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete course "${name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
  };

  const handleOpenRegistrations = (course: Course) => {
    setSelectedCourseForRegs(course);
    setIsRegistrationsOpen(true);
  };

  // Dynamically compute prefixes (e.g. "CSE", "ECE" etc.) from existing course codes
  const prefixes = [
    'ALL',
    ...Array.from(
      new Set(
        courses
          .map((c) => c.courseCode.trim().split(/\d/)[0].toUpperCase())
          .filter(Boolean)
      )
    ),
  ];

  const filtered = courses
    .filter((c) => {
      const matchesSearch =
        c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
        c.courseTitle.toLowerCase().includes(search.toLowerCase());

      const matchesPrefix =
        prefixFilter === 'ALL' ||
        c.courseCode.trim().toUpperCase().startsWith(prefixFilter);

      return matchesSearch && matchesPrefix;
    })
    .sort((a, b) => {
      if (sortBy === 'CODE_ASC') {
        return a.courseCode.localeCompare(b.courseCode);
      } else if (sortBy === 'TITLE_ASC') {
        return a.courseTitle.localeCompare(b.courseTitle);
      } else if (sortBy === 'TITLE_DESC') {
        return b.courseTitle.localeCompare(a.courseTitle);
      }
      return 0;
    });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Course Management</h1>
            <p className="text-white/50 text-sm mt-1">
              {courses.length} total courses configured ({filtered.length} visible)
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingCourse(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-klu-darker font-semibold rounded-xl hover:bg-klu-accent transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </motion.button>
        </div>

        {/* Controls Bar */}
        <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search box */}
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
            {/* Department prefix filters */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-white/40 mr-1" />
              <select
                value={prefixFilter}
                onChange={(e) => setPrefixFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {prefixes.map((pref) => (
                  <option key={pref} value={pref} className="bg-klu-darker">
                    {pref === 'ALL' ? 'All Prefixes' : `${pref} Prefix`}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting order selection */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-white/40 mr-1" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="CODE_ASC" className="bg-klu-darker">Code (A-Z)</option>
                <option value="TITLE_ASC" className="bg-klu-darker">Title (A-Z)</option>
                <option value="TITLE_DESC" className="bg-klu-darker">Title (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 space-y-3">
                <div className="shimmer h-4 w-1/3 rounded" />
                <div className="shimmer h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/40 font-medium">No courses found matching criteria.</p>
            <p className="text-white/30 text-xs mt-1">Try resetting the prefix filter or query.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((course) => (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleOpenRegistrations(course)}
                  className="glass rounded-2xl p-5 group hover:bg-white/8 cursor-pointer transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="inline-block px-2.5 py-0.5 bg-white/10 rounded-md text-xs font-mono text-white/60 mb-2.5">
                        {course.courseCode}
                      </span>
                      <p className="font-semibold text-white text-base leading-snug">
                        {course.courseTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCourse(course);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Edit Course"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(course.id, course.courseTitle);
                        }}
                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCourse(null);
        }}
        editingCourse={editingCourse}
      />

      <CourseRegistrationsModal
        isOpen={isRegistrationsOpen}
        onClose={() => {
          setIsRegistrationsOpen(false);
          setSelectedCourseForRegs(null);
        }}
        course={selectedCourseForRegs}
      />
    </DashboardLayout>
  );
}
