package com.klu.certification.controller;

import com.klu.certification.dto.ApiResponse;
import com.klu.certification.dto.RegisteredCourseDto;
import com.klu.certification.dto.SubmitCertificationRequest;
import com.klu.certification.service.CertificationService;
import com.klu.certification.service.CourseService;
import com.klu.certification.dto.CourseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentController {

    private final CertificationService certificationService;
    private final CourseService courseService;

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getCourses() {
        return ResponseEntity.ok(ApiResponse.success(courseService.getAllCourses()));
    }

    @GetMapping("/certifications")
    public ResponseEntity<ApiResponse<List<RegisteredCourseDto>>> getMyCertifications(
            Authentication auth) {
        String universityId = auth.getName();
        return ResponseEntity.ok(ApiResponse.success(
            certificationService.getStudentCertifications(universityId)
        ));
    }

    @PostMapping("/certifications")
    public ResponseEntity<ApiResponse<RegisteredCourseDto>> submitCertification(
            @Valid @RequestBody SubmitCertificationRequest request,
            Authentication auth) {
        String universityId = auth.getName();
        RegisteredCourseDto dto = certificationService.submitCertification(universityId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Certification submitted successfully", dto));
    }
}
