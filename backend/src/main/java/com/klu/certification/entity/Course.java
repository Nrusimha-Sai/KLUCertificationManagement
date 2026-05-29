package com.klu.certification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "courses",
    indexes = {
        @Index(name = "idx_courses_code", columnList = "course_code", unique = true)
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @Column(name = "course_code", nullable = false, length = 20)
    private String courseCode;

    @Column(name = "course_title", nullable = false, length = 200)
    private String courseTitle;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
