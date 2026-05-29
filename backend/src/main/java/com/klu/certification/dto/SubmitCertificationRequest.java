package com.klu.certification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SubmitCertificationRequest {

    @NotBlank(message = "Course code is required")
    private String courseCode;

    @NotBlank(message = "Verification link is required")
    @Pattern(
        regexp = "^https?://.*$",
        message = "Invalid link format. Must be a valid URL starting with http:// or https://"
    )
    private String credlyLink;
}
