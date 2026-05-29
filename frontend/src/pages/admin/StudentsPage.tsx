import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Filter,
  X,
  Mail,
  Building,
  Key,
  Shield,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  XCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi } from '@/api';
import { useUIStore } from '@/store/uiStore';
import type { User } from '@/types';
import DashboardLayout from '@/layouts/DashboardLayout';
import { formatDate } from '@/lib/utils';

const studentSchema = z.object({
  universityId: z
    .string()
    .min(3, 'University ID must be at least 3 characters')
    .max(50, 'University ID must not exceed 50 characters')
    .trim(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must not exceed 100 characters')
    .or(z.literal(''))
    .optional(),
  dept: z.string().max(50, 'Department must not exceed 50 characters').trim().optional(),
  securityCode: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent?: User | null;
}

function StudentModal({ isOpen, onClose, editingStudent }: StudentModalProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    values: editingStudent
      ? {
          universityId: editingStudent.universityId,
          name: editingStudent.name,
          email: editingStudent.email || '',
          dept: editingStudent.dept || '',
          securityCode: '',
        }
      : {
          universityId: '',
          name: '',
          email: '',
          dept: '',
          securityCode: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      addNotification({ type: 'success', title: 'Student Created' });
      reset();
      onClose();
    },
    onError: (err: any) =>
      addNotification({
        type: 'error',
        title: 'Error Creating Student',
        message: err.response?.data?.message || 'An error occurred.',
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ universityId, data }: { universityId: string; data: StudentForm }) =>
      adminApi.updateStudent(universityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      // Invalidate registrations cache in case student details changed
      queryClient.invalidateQueries({ queryKey: ['course-registrations'] });
      addNotification({ type: 'success', title: 'Student Updated' });
      reset();
      onClose();
    },
    onError: (err: any) =>
      addNotification({
        type: 'error',
        title: 'Error Updating Student',
        message: err.response?.data?.message || 'An error occurred.',
      }),
  });

  const onSubmit = (data: StudentForm) => {
    // If creating a new student, securityCode is required
    if (!editingStudent && (!data.securityCode || data.securityCode.trim() === '')) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Security code is required for new students.',
      });
      return;
    }

    if (editingStudent) {
      updateMutation.mutate({ universityId: editingStudent.universityId, data });
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
          className="relative w-full max-w-md glass rounded-3xl p-6 sm:p-8 shadow-glass-lg z-10 max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-xl font-bold text-white mb-6">
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                University ID (Primary Key)
              </label>
              <input
                {...register('universityId')}
                disabled={!!editingStudent}
                placeholder="e.g. 21CC3140"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 font-mono text-sm"
              />
              {errors.universityId && (
                <p className="mt-1 text-xs text-red-400">{errors.universityId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
              <input
                {...register('name')}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Email Address <span className="text-white/30">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('email')}
                  placeholder="e.g. student@klu.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Department <span className="text-white/30">(Optional)</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('dept')}
                  placeholder="e.g. CSE"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                />
              </div>
              {errors.dept && (
                <p className="mt-1 text-xs text-red-400">{errors.dept.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2 font-semibold flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-white/50" />
                Security Code (Password)
              </label>
              <input
                type="password"
                {...register('securityCode')}
                placeholder={editingStudent ? '•••••••• (leave blank to keep unchanged)' : 'e.g. Password@123'}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
              />
              <p className="mt-1 text-[10px] text-white/40">
                {editingStudent
                  ? 'Only fill this field in if you wish to reset this student\'s password.'
                  : 'Used by the student to authenticate.'}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 bg-white text-klu-darker font-bold rounded-xl hover:bg-klu-accent transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingStudent ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function StudentCertificationsModal({
  isOpen,
  onClose,
  student,
}: {
  isOpen: boolean;
  onClose: () => void;
  student: User | null;
}) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['student-certifications', student?.universityId],
    queryFn: () => (student ? adminApi.getStudentCertifications(student.universityId) : Promise.resolve([])),
    enabled: !!student && isOpen,
    staleTime: 10 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-certifications', student?.universityId] });
      queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['course-registrations'] });
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
      queryClient.invalidateQueries({ queryKey: ['student-certifications', student?.universityId] });
      queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['course-registrations'] });
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
  };

  if (!isOpen || !student) return null;

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
                {student.universityId}
              </span>
              <h2 className="text-xl font-bold text-white leading-snug">{student.name}</h2>
              <p className="text-white/50 text-xs mt-1">Student certification portfolio</p>
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
                <p className="text-center text-xs text-white/40">Retrieving certifications...</p>
              </div>
            ) : certifications.length === 0 ? (
              <div className="text-center py-12 border border-white/5 bg-white/2 rounded-2xl">
                <Award className="w-10 h-10 mx-auto mb-3 text-white/20" />
                <p className="text-sm text-white/40 font-medium">No certifications submitted yet.</p>
                <p className="text-xs text-white/30 mt-1">This student has not submitted any certification requests.</p>
              </div>
            ) : (
              <div className="border border-white/5 rounded-2xl overflow-x-auto bg-white/2">
                <table className="w-full text-left text-sm text-white/80 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Course Code</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Course Title</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Submitted</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Certificate</th>
                      <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certifications.map((cert) => (
                      <tr key={cert.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-white/60">{cert.courseCode}</td>
                        <td className="px-4 py-3 text-white font-semibold">{cert.courseTitle}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGES[cert.status] || ''}`}>
                            {cert.status === 'APPROVED' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5 animate-pulse" />}
                            {cert.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40">{formatDate(cert.submittedAt)}</td>
                        <td className="px-4 py-3">
                          <a
                            href={cert.credlyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-white/40 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {cert.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => approveMutation.mutate(cert.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                className="p-1 text-green-400 hover:bg-green-400/10 rounded transition-all"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Reject and delete certification request?`)) {
                                    rejectMutation.mutate(cert.id);
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
                          {cert.status === 'APPROVED' && (
                            <CheckCircle2 className="w-4 h-4 text-green-400/40 ml-auto" />
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
              Close Portfolio
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Certifications modal states
  const [isCertificationsOpen, setIsCertificationsOpen] = useState(false);
  const [selectedStudentForCerts, setSelectedStudentForCerts] = useState<User | null>(null);

  const handleOpenCertifications = (student: User) => {
    setSelectedStudentForCerts(student);
    setIsCertificationsOpen(true);
  };

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: adminApi.getStudents,
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      // Invalidate registrations since student registration records are deleted as well
      queryClient.invalidateQueries({ queryKey: ['course-registrations'] });
      addNotification({ type: 'info', title: 'Student Profile Deleted' });
    },
    onError: (err: any) =>
      addNotification({
        type: 'error',
        title: 'Error Deleting Student',
        message: err.response?.data?.message || 'An error occurred.',
      }),
  });

  const handleDelete = (universityId: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete student "${name}" (${universityId})?\n\nThis will also permanently delete all certification requests submitted by this student. This action cannot be undone.`
      )
    )
      return;
    deleteMutation.mutate(universityId);
  };

  // Dynamically extract departments list for filtering
  const departments = [
    'ALL',
    ...Array.from(
      new Set(
        students
          .map((s) => s.dept?.trim().toUpperCase())
          .filter(Boolean)
      )
    ),
  ] as string[];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.universityId.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.dept && s.dept.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      selectedDept === 'ALL' || (s.dept && s.dept.trim().toUpperCase() === selectedDept);

    return matchesSearch && matchesDept;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-white/80" />
              Student Directory
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {students.length} total student accounts registered ({filteredStudents.length} visible)
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingStudent(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-klu-darker font-semibold rounded-xl hover:bg-klu-accent transition-all shrink-0 text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </motion.button>
        </div>

        {/* Controls Bar */}
        <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search by ID, name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-white/40" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-klu-darker">
                    {dept === 'ALL' ? 'All Departments' : `${dept}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        {isLoading ? (
          <div className="glass rounded-2xl p-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/40" />
            <p className="text-center text-xs text-white/40">Retrieving student directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/40 font-medium">No students found matching search criteria.</p>
            <p className="text-white/30 text-xs mt-1">Try updating the search query or department filter.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      University ID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {filteredStudents.map((student) => (
                      <motion.tr
                        key={student.universityId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        layout
                        onClick={() => handleOpenCertifications(student)}
                        className="hover:bg-white/2 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-white font-medium">
                          {student.universityId}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-white">{student.name}</p>
                          {student.email && (
                            <p className="text-xs text-white/40 mt-0.5">{student.email}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {student.dept ? (
                            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white/70">
                              {student.dept}
                            </span>
                          ) : (
                            <span className="text-xs text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-white/50">
                          {formatDate(student.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenCertifications(student)}
                              className="p-2 text-white/40 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-xl transition-all"
                              title="View Certifications"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStudent(student);
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                              title="Edit Student"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(student.universityId, student.name)}
                              className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <StudentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        editingStudent={editingStudent}
      />

      <StudentCertificationsModal
        isOpen={isCertificationsOpen}
        onClose={() => {
          setIsCertificationsOpen(false);
          setSelectedStudentForCerts(null);
        }}
        student={selectedStudentForCerts}
      />
    </DashboardLayout>
  );
}
