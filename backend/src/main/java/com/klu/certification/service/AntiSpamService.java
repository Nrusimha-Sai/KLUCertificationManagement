package com.klu.certification.service;

import com.klu.certification.entity.User;
import com.klu.certification.exception.BusinessException;
import com.klu.certification.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AntiSpamService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;

    @Value("${antispam.rate-limit.max-requests:10}")
    private int maxRequests;

    @Value("${antispam.rate-limit.window-seconds:60}")
    private long windowSeconds;

    @Value("${antispam.block-duration-hours:24}")
    private int blockDurationHours;

    @Value("${antispam.max-duplicate-attempts:3}")
    private int maxDuplicateAttempts;

    private static final String RATE_LIMIT_PREFIX = "rl:";
    private static final String DUPLICATE_PREFIX = "dup:";
    private static final String ACTIVE_USERS_KEY = "active_users";

    public void checkRateLimit(String universityId) {
        String key = RATE_LIMIT_PREFIX + universityId;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofSeconds(windowSeconds));
        }
        if (count != null && count > maxRequests) {
            log.warn("Rate limit exceeded for user: {}", universityId);
            throw BusinessException.tooManyRequests(
                "Too many requests. Please slow down and try again in a moment."
            );
        }
    }

    @Transactional
    public void checkAndRecordDuplicateSubmission(String universityId, String credlyLink) {
        String key = DUPLICATE_PREFIX + universityId + ":" + credlyLink.hashCode();
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofHours(24));
        }
        if (count != null && count > maxDuplicateAttempts) {
            log.warn("Duplicate spam detected for user: {}", universityId);
            blockUser(universityId);
            throw BusinessException.tooManyRequests(
                "Repeated duplicate submissions detected. Your account has been temporarily blocked for 24 hours."
            );
        }
    }

    @Transactional
    public void blockUser(String universityId) {
        userRepository.findByUniversityId(universityId).ifPresent(user -> {
            user.setBlockedUntil(LocalDateTime.now().plusHours(blockDurationHours));
            userRepository.save(user);
            log.info("User {} has been blocked for {} hours", universityId, blockDurationHours);
        });
    }

    public void trackActiveUser(String universityId) {
        redisTemplate.opsForSet().add(ACTIVE_USERS_KEY, universityId);
        redisTemplate.expire(ACTIVE_USERS_KEY, Duration.ofMinutes(5));
    }

    public void removeActiveUser(String universityId) {
        redisTemplate.opsForSet().remove(ACTIVE_USERS_KEY, universityId);
    }

    public long getActiveUserCount() {
        Long size = redisTemplate.opsForSet().size(ACTIVE_USERS_KEY);
        return size != null ? size : 0;
    }

    public void clearRateLimit(String universityId) {
        redisTemplate.delete(RATE_LIMIT_PREFIX + universityId);
    }
}
