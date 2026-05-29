package com.klu.certification.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class SocketIOConfig {

    @Value("${socketio.host:0.0.0.0}")
    private String host;

    @Value("${socketio.port:9092}")
    private int port;

    @Value("${socketio.boss-count:1}")
    private int bossCount;

    @Value("${socketio.worker-count:4}")
    private int workerCount;

    @Value("${socketio.ping-timeout:60000}")
    private int pingTimeout;

    @Value("${socketio.ping-interval:25000}")
    private int pingInterval;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setBossThreads(bossCount);
        config.setWorkerThreads(workerCount);
        config.setPingTimeout(pingTimeout);
        config.setPingInterval(pingInterval);
        config.setAllowCustomRequests(false);

        // CORS for Socket.IO
        com.corundumstudio.socketio.SocketConfig socketConfig = new com.corundumstudio.socketio.SocketConfig();
        socketConfig.setReuseAddress(true);
        config.setSocketConfig(socketConfig);

        return new SocketIOServer(config);
    }

    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketServer) {
        return new SpringAnnotationScanner(socketServer);
    }
}
