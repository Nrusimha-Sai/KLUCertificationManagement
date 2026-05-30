// ─── Auth Types ───────────────────────────────────────────────────────────
export interface User {
  id: string;
  universityId: string;
  name: string;
  email?: string;
  dept?: string;
  role: 'STUDENT' | 'ADMIN';
  blockedUntil?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  universityId: string;
  securityCode: string;
}

// ─── Course Types ─────────────────────────────────────────────────────────
export interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
}

export interface CourseRequest {
  courseCode: string;
  courseTitle: string;
}

// ─── Certification Types ───────────────────────────────────────────────────
export type CertificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Certification {
  id: string;
  universityId: string;
  studentName: string;
  studentEmail?: string;
  studentDept?: string;
  courseCode: string;
  courseTitle: string;
  credlyLink: string;
  status: CertificationStatus;
  submittedAt: string;
  verifiedAt?: string;
}

export interface SubmitCertificationRequest {
  courseCode: string;
  credlyLink: string;
}

// ─── Analytics Types ──────────────────────────────────────────────────────
export interface CoursePopularity {
  courseCode: string;
  courseTitle: string;
  count: number;
}

export interface TopStudent {
  universityId: string;
  studentName: string;
  certificationCount: number;
}

export interface Analytics {
  totalStudents: number;
  totalCertifications: number;
  pendingRequests: number;
  approvedCertifications: number;
  rejectedCertifications: number;
  approvalRate: number;
  activeUsers: number;
  coursePopularity: CoursePopularity[];
  topStudents: TopStudent[];
}

// ─── API Response Types ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ─── Socket Event Types ────────────────────────────────────────────────────
export interface PendingCountUpdate {
  pendingCount: number;
}

export interface ActiveUsersUpdate {
  count: number;
}

export interface CertificationRejectedPayload {
  universityId: string;
  courseCode: string;
}
