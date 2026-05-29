package com.klu.certification.socket;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.klu.certification.security.JwtUtil;
import com.klu.certification.service.AntiSpamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketEventHandler {

    private final SocketIOServer server;
    private final JwtUtil jwtUtil;
    private final AntiSpamService antiSpamService;
    private final SocketEventEmitter socketEventEmitter;

    @PostConstruct
    public void startServer() {
        server.addConnectListener(onConnect());
        server.addDisconnectListener(onDisconnect());
        try {
            server.start();
            log.info("Socket.IO server started on port {}", server.getConfiguration().getPort());
        } catch (Exception e) {
            log.warn("Failed to start Socket.IO server (e.g. port already in use): {}", e.getMessage());
        }
    }

    @PreDestroy
    public void stopServer() {
        server.stop();
        log.info("Socket.IO server stopped");
    }

    private ConnectListener onConnect() {
        return client -> {
            String token = client.getHandshakeData().getSingleUrlParam("token");
            if (token == null || token.isBlank() || !jwtUtil.validateToken(token)) {
                log.warn("Socket connection rejected - invalid token");
                client.disconnect();
                return;
            }

            String universityId = jwtUtil.extractUniversityId(token).trim();
            String role = jwtUtil.extractRole(token).trim().toUpperCase();

            // Store universityId in session
            client.set("universityId", universityId);
            client.set("role", role);

            // Join appropriate rooms
            if ("ADMIN".equals(role)) {
                client.joinRoom("admins");
                log.info("Admin {} connected via WebSocket", universityId);
            } else {
                client.joinRoom("student:" + universityId.toLowerCase());
                antiSpamService.trackActiveUser(universityId);
                socketEventEmitter.broadcastActiveUsers(antiSpamService.getActiveUserCount());
                log.info("Student {} connected via WebSocket", universityId);
            }
        };
    }

    private DisconnectListener onDisconnect() {
        return client -> {
            String universityId = client.get("universityId");
            String role = client.get("role");

            if (universityId != null) {
                if ("STUDENT".equals(role)) {
                    antiSpamService.removeActiveUser(universityId);
                    socketEventEmitter.broadcastActiveUsers(antiSpamService.getActiveUserCount());
                }
                log.info("User {} disconnected from WebSocket", universityId);
            }
        };
    }
}
