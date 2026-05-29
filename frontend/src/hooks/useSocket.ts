import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import type {
  Certification,
  PendingCountUpdate,
  ActiveUsersUpdate,
  CertificationRejectedPayload,
} from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:9092';

let globalSocket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuthStore();
  const { setPendingCount, setActiveUsers, addNotification } = useUIStore();
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (!token) return;
    if (globalSocket?.connected) {
      setIsConnected(true);
      return;
    }

    const socket = io(SOCKET_URL, {
      query: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    globalSocket = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }, [token]);

  const disconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      setIsConnected(false);
    }
  }, []);

  // Connection manager
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }
  }, [token, connect, disconnect]);

  // Event listeners manager — binds to the active globalSocket
  useEffect(() => {
    const socket = globalSocket;
    if (!socket || !isConnected) return;

    // Remove any previous duplicate listeners
    socket.off('pending_count_update');
    socket.off('active_users_update');
    socket.off('new_submission');
    socket.off('analytics_refresh');
    socket.off('certification_approved');
    socket.off('certification_rejected');
    socket.off('my_certification_approved');
    socket.off('my_certification_rejected');

    // ─── Pending count updates (all users)
    socket.on('pending_count_update', (data: PendingCountUpdate) => {
      setPendingCount(data.pendingCount);
    });

    // ─── Active users update (all users)
    socket.on('active_users_update', (data: ActiveUsersUpdate) => {
      setActiveUsers(data.count);
    });

    if (user?.role === 'ADMIN') {
      // New submission notification for admins
      socket.on('new_submission', (cert: Certification) => {
        queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
        queryClient.invalidateQueries({ queryKey: ['course-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
        addNotification({
          type: 'info',
          title: 'New Certification Request',
          message: `${cert.studentName} submitted for ${cert.courseTitle}`,
        });
      });

      // Analytics refresh signal
      socket.on('analytics_refresh', () => {
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      });

      socket.on('certification_approved', () => {
        queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
        queryClient.invalidateQueries({ queryKey: ['course-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
      });

      socket.on('certification_rejected', () => {
        queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
        queryClient.invalidateQueries({ queryKey: ['course-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
      });
    }

    if (user?.role === 'STUDENT') {
      // Student's own certification approved
      socket.on('my_certification_approved', (cert: Certification) => {
        queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
        addNotification({
          type: 'success',
          title: 'Certification Approved! 🎉',
          message: `Your ${cert.courseTitle} certification has been approved.`,
        });
      });

      // Student's certification rejected
      socket.on('my_certification_rejected', (data: CertificationRejectedPayload) => {
        queryClient.invalidateQueries({ queryKey: ['student-certifications'] });
        addNotification({
          type: 'error',
          title: 'Certification Rejected',
          message: `Your submission for course ${data.courseCode} was rejected.`,
        });
      });
    }

    return () => {
      socket.off('pending_count_update');
      socket.off('active_users_update');
      socket.off('new_submission');
      socket.off('analytics_refresh');
      socket.off('certification_approved');
      socket.off('certification_rejected');
      socket.off('my_certification_approved');
      socket.off('my_certification_rejected');
    };
  }, [isConnected, user, setPendingCount, setActiveUsers, addNotification, queryClient]);

  return { socket: globalSocket, connect, disconnect };
}
