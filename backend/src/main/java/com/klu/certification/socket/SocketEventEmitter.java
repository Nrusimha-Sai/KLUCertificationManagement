package com.klu.certification.socket;

import com.corundumstudio.socketio.SocketIOServer;
import com.klu.certification.dto.RegisteredCourseDto;
import com.klu.certification.repository.RegisteredCourseRepository;
import com.klu.certification.entity.RegisteredCourse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketEventEmitter {

    private final SocketIOServer server;
    private final RegisteredCourseRepository registeredCourseRepository;

    // Emit to all connected admins about a new submission
    public void emitNewSubmission(RegisteredCourseDto dto) {
        server.getRoomOperations("admins").sendEvent("new_submission", dto);
        log.debug("Emitted new_submission event for course: {}", dto.getCourseCode());
    }

    // Emit certification approval to student and all admins
    public void emitCertificationApproved(RegisteredCourseDto dto) {
        server.getRoomOperations("admins").sendEvent("certification_approved", dto);
        server.getRoomOperations("student:" + dto.getUniversityId().trim().toLowerCase())
              .sendEvent("my_certification_approved", dto);
        log.debug("Emitted certification_approved for student: {}", dto.getUniversityId());
    }

    // Emit certification rejection to student and all admins
    public void emitCertificationRejected(String universityId, String courseCode) {
        Map<String, String> payload = new HashMap<>();
        payload.put("universityId", universityId);
        payload.put("courseCode", courseCode);

        server.getRoomOperations("admins").sendEvent("certification_rejected", payload);
        server.getRoomOperations("student:" + universityId.trim().toLowerCase())
              .sendEvent("my_certification_rejected", payload);
        log.debug("Emitted certification_rejected for student: {}", universityId);
    }

    // Emit real-time pending count update
    public void emitPendingCountUpdate() {
        long pendingCount = registeredCourseRepository.countByStatus(RegisteredCourse.Status.PENDING);
        Map<String, Long> payload = new HashMap<>();
        payload.put("pendingCount", pendingCount);
        server.getBroadcastOperations().sendEvent("pending_count_update", payload);
    }

    // Emit analytics invalidation signal to refresh dashboards
    public void emitAnalyticsUpdate() {
        server.getRoomOperations("admins").sendEvent("analytics_refresh", Map.of("refresh", true));
    }

    // Broadcast to all connected clients (e.g., active user count)
    public void broadcastActiveUsers(long count) {
        server.getBroadcastOperations().sendEvent("active_users_update", Map.of("count", count));
    }

    // Admin broadcast message
    public void broadcastAdminMessage(String message) {
        server.getBroadcastOperations().sendEvent("admin_broadcast", Map.of("message", message));
    }
}
