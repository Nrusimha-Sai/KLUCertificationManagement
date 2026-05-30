package com.klu.certification.controller;

import com.klu.certification.dto.ApiResponse;
import com.klu.certification.dto.RegisteredCourseDto;
import com.klu.certification.dto.SubmitCertificationRequest;
import com.klu.certification.service.CertificationService;
import com.klu.certification.service.CourseService;
import com.klu.certification.service.ExcelExportService;
import com.klu.certification.dto.CourseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    private final ExcelExportService excelExportService;

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

    @GetMapping("/export/certifications")
    public ResponseEntity<byte[]> exportMyCertifications(Authentication auth) {
        String universityId = auth.getName();
        List<RegisteredCourseDto> data = certificationService.getStudentCertifications(universityId);
        byte[] excelBytes = excelExportService.exportCertifications(data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ));
        headers.setContentDispositionFormData("attachment", "my-certifications.xlsx");
        headers.setContentLength(excelBytes.length);

        return ResponseEntity.ok().headers(headers).body(excelBytes);
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

    @DeleteMapping("/certifications/{courseCode}")
    public ResponseEntity<ApiResponse<Void>> deleteRejectedCertification(
            @PathVariable String courseCode,
            Authentication auth) {
        String universityId = auth.getName();
        certificationService.deleteRejectedCertification(universityId, courseCode);
        return ResponseEntity.ok(ApiResponse.success("Rejected certification request deleted successfully", null));
    }
}
