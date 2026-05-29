package com.klu.certification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StudentRequest {

    @NotBlank(message = "University ID is required")
    @Size(max = 50, message = "University ID must not exceed 50 characters")
    private String universityId;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Email(message = "Please enter a valid email address")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Size(max = 50, message = "Department must not exceed 50 characters")
    private String dept;

    private String securityCode; // Required for creation, optional for updates
}
