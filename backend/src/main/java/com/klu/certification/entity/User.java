package com.klu.certification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_users_university_id", columnList = "university_id", unique = true),
        @Index(name = "idx_users_role", columnList = "role")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(name = "university_id", nullable = false, length = 50)
    private String universityId;

    @Column(name = "security_code", nullable = false)
    private String securityCode;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "dept", length = 50)
    private String dept;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 10)
    private Role role;

    @Column(name = "blocked_until")
    private LocalDateTime blockedUntil;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isBlocked() {
        return blockedUntil != null && LocalDateTime.now().isBefore(blockedUntil);
    }

    public enum Role {
        STUDENT, ADMIN
    }
}
