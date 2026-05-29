package com.klu.certification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "registered_courses",
    indexes = {
        @Index(name = "idx_rc_university_id", columnList = "university_id"),
        @Index(name = "idx_rc_status", columnList = "status"),
        @Index(name = "idx_rc_submitted_at", columnList = "submitted_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(RegisteredCourseId.class)
public class RegisteredCourse {

    @Id
    @Column(name = "university_id", nullable = false, length = 50)
    private String universityId;

    @Column(name = "student_name", nullable = false, length = 100)
    private String studentName;

    @Id
    @Column(name = "course_code", nullable = false, length = 20)
    private String courseCode;

    @Column(name = "course_title", nullable = false, length = 200)
    private String courseTitle;

    @Column(name = "credly_link", nullable = false, length = 500)
    private String credlyLink;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    private Status status;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}
