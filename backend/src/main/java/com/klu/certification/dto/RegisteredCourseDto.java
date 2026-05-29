package com.klu.certification.dto;

import com.klu.certification.entity.RegisteredCourse;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RegisteredCourseDto {
    private String id;
    private String universityId;
    private String studentName;
    private String courseCode;
    private String courseTitle;
    private String credlyLink;
    private RegisteredCourse.Status status;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;
    private String studentEmail;
    private String studentDept;
}
