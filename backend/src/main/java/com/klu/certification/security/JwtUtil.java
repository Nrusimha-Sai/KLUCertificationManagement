package com.klu.certification.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JwtUtil {

    public String generateToken(String universityId, String role) {
        return universityId + ":" + role;
    }

    public String extractUniversityId(String token) {
        if (token == null || !token.contains(":")) {
            return null;
        }
        return token.split(":")[0];
    }

    public String extractRole(String token) {
        if (token == null || !token.contains(":")) {
            return null;
        }
        return token.split(":")[1];
    }

    public boolean validateToken(String token) {
        return token != null && token.contains(":");
    }
}
