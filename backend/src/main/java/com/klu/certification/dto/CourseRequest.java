package com.klu.certification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CourseRequest {

    @NotBlank(message = "Course code is required")
    @Size(max = 20, message = "Course code must not exceed 20 characters")
    private String courseCode;

    @NotBlank(message = "Course title is required")
    @Size(max = 200, message = "Course title must not exceed 200 characters")
    private String courseTitle;
}
