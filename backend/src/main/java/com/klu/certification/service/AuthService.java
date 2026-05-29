package com.klu.certification.service;

import com.klu.certification.dto.AuthResponse;
import com.klu.certification.dto.LoginRequest;
import com.klu.certification.dto.UserDto;
import com.klu.certification.entity.User;
import com.klu.certification.exception.BusinessException;
import com.klu.certification.repository.UserRepository;
import com.klu.certification.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUniversityId(request.getUniversityId())
                .orElseThrow(() -> BusinessException.unauthorized("Invalid university ID or security code"));

        if (user.isBlocked()) {
            throw BusinessException.forbidden(
                "Your account has been temporarily blocked due to suspicious activity. " +
                "Please try again after " + user.getBlockedUntil().toString()
            );
        }

        if (!user.getSecurityCode().equals(request.getSecurityCode())) {
            throw BusinessException.unauthorized("Invalid university ID or security code");
        }

        String token = jwtUtil.generateToken(user.getUniversityId(), user.getRole().name());
        UserDto userDto = mapToDto(user);

        log.info("User {} logged in successfully", user.getUniversityId());
        return AuthResponse.builder().token(token).user(userDto).build();
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getUniversityId())
                .universityId(user.getUniversityId())
                .name(user.getName())
                .email(user.getEmail())
                .dept(user.getDept())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
