package com.klu.certification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "University ID is required")
    private String universityId;

    @NotBlank(message = "Security code is required")
    private String securityCode;
}
