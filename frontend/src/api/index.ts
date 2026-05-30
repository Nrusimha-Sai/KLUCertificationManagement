import { apiClient } from '@/lib/apiClient';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  User,
  Course,
  CourseRequest,
  Certification,
  SubmitCertificationRequest,
  Analytics,
  PageResponse,
} from '@/types';

// ─── Auth API ──────────────────────────────────────────────────────────────
export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data;
  },
};

// ─── Student API ───────────────────────────────────────────────────────────
export const studentApi = {
  getCourses: async (): Promise<Course[]> => {
    const res = await apiClient.get<ApiResponse<Course[]>>('/student/courses');
    return res.data.data;
  },

  getMyCertifications: async (): Promise<Certification[]> => {
    const res = await apiClient.get<ApiResponse<Certification[]>>('/student/certifications');
    return res.data.data;
  },

  submitCertification: async (data: SubmitCertificationRequest): Promise<Certification> => {
    const res = await apiClient.post<ApiResponse<Certification>>('/student/certifications', data);
    return res.data.data;
  },

  deleteRejectedCertification: async (courseCode: string): Promise<void> => {
    await apiClient.delete(`/student/certifications/${courseCode}`);
  },

  exportMyCertifications: async (): Promise<Blob> => {
    const res = await apiClient.get('/student/export/certifications', {
      responseType: 'blob',
    });
    return res.data;
  },
};

// ─── Admin API ────────────────────────────────────────────────────────────
export const adminApi = {
  getAnalytics: async (): Promise<Analytics> => {
    const res = await apiClient.get<ApiResponse<Analytics>>('/admin/analytics');
    return res.data.data;
  },

  getCertifications: async (params: {
    query?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Certification>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Certification>>>(
      '/admin/certifications',
      { params }
    );
    return res.data.data;
  },

  approveCertification: async (id: string): Promise<Certification> => {
    const [universityId, courseCode] = id.split('_');
    const res = await apiClient.patch<ApiResponse<Certification>>(
      `/admin/certifications/${universityId}/${courseCode}/approve`
    );
    return res.data.data;
  },

  rejectCertification: async (id: string): Promise<void> => {
    const [universityId, courseCode] = id.split('_');
    await apiClient.delete(`/admin/certifications/${universityId}/${courseCode}/reject`);
  },

  getCourses: async (): Promise<Course[]> => {
    const res = await apiClient.get<ApiResponse<Course[]>>('/admin/courses');
    return res.data.data;
  },

  createCourse: async (data: CourseRequest): Promise<Course> => {
    const res = await apiClient.post<ApiResponse<Course>>('/admin/courses', data);
    return res.data.data;
  },

  updateCourse: async (id: string, data: Partial<CourseRequest>): Promise<Course> => {
    const res = await apiClient.put<ApiResponse<Course>>(`/admin/courses/${id}`, data);
    return res.data.data;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/courses/${id}`);
  },

  getCourseRegistrations: async (courseCode: string): Promise<Certification[]> => {
    const res = await apiClient.get<ApiResponse<Certification[]>>(
      `/admin/courses/${courseCode}/registrations`
    );
    return res.data.data;
  },

  exportCertifications: async (): Promise<Blob> => {
    const res = await apiClient.get('/admin/export/certifications', {
      responseType: 'blob',
    });
    return res.data;
  },

  exportCourseCertifications: async (courseCode: string): Promise<Blob> => {
    const res = await apiClient.get(`/admin/courses/${courseCode}/export`, {
      responseType: 'blob',
    });
    return res.data;
  },

  createManualCertification: async (data: {
    universityId: string;
    courseCode: string;
    credlyLink: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }): Promise<Certification> => {
    const res = await apiClient.post<ApiResponse<Certification>>('/admin/certifications', data);
    return res.data.data;
  },

  getStudents: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>('/admin/students');
    return res.data.data;
  },

  getStudentCertifications: async (universityId: string): Promise<Certification[]> => {
    const res = await apiClient.get<ApiResponse<Certification[]>>(
      `/admin/students/${universityId}/certifications`
    );
    return res.data.data;
  },

  exportStudentData: async (universityId: string): Promise<Blob> => {
    const res = await apiClient.get(`/admin/students/${universityId}/export`, {
      responseType: 'blob',
    });
    return res.data;
  },

  createStudent: async (data: any): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/admin/students', data);
    return res.data.data;
  },

  updateStudent: async (universityId: string, data: any): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(`/admin/students/${universityId}`, data);
    return res.data.data;
  },

  deleteStudent: async (universityId: string): Promise<void> => {
    await apiClient.delete(`/admin/students/${universityId}`);
  },
};
