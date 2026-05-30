package com.klu.certification.dto;

import com.klu.certification.entity.RegisteredCourse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminCreateCertificationRequest {

    @NotBlank(message = "University ID is required")
    private String universityId;

    @NotBlank(message = "Course code is required")
    private String courseCode;

    @NotBlank(message = "Certification link is required")
    private String credlyLink;

    @NotNull(message = "Status is required")
    private RegisteredCourse.Status status;
}
