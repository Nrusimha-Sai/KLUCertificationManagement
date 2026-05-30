package com.klu.certification.controller;

import com.klu.certification.dto.*;
import com.klu.certification.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CertificationService certificationService;
    private final CourseService courseService;
    private final AnalyticsService analyticsService;
    private final ExcelExportService excelExportService;
    private final UserService userService;

    // ─── Analytics ───────────────────────────────────────────────────────────

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AnalyticsDto>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDashboardAnalytics()));
    }

    // ─── Certifications ───────────────────────────────────────────────────────

    @GetMapping("/certifications")
    public ResponseEntity<ApiResponse<Page<RegisteredCourseDto>>> getCertifications(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "submittedAt"));
        Page<RegisteredCourseDto> result = certificationService.getAllCertifications(query, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PatchMapping("/certifications/{universityId}/{courseCode}/approve")
    public ResponseEntity<ApiResponse<RegisteredCourseDto>> approve(
            @PathVariable String universityId,
            @PathVariable String courseCode) {
        return ResponseEntity.ok(ApiResponse.success(
            "Certification approved",
            certificationService.approveCertification(universityId, courseCode)
        ));
    }

    @DeleteMapping("/certifications/{universityId}/{courseCode}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable String universityId,
            @PathVariable String courseCode) {
        certificationService.rejectCertification(universityId, courseCode);
        return ResponseEntity.ok(ApiResponse.success("Certification rejected and removed", null));
    }

    @PostMapping("/certifications")
    public ResponseEntity<ApiResponse<RegisteredCourseDto>> createCertificationManually(
            @Valid @RequestBody AdminCreateCertificationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
            "Certification created manually",
            certificationService.createCertificationManually(request)
        ));
    }

    // ─── Courses ─────────────────────────────────────────────────────────────

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getCourses() {
        return ResponseEntity.ok(ApiResponse.success(courseService.getAllCourses()));
    }

    @PostMapping("/courses")
    public ResponseEntity<ApiResponse<CourseDto>> createCourse(@Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Course created", courseService.createCourse(request)));
    }

    @PutMapping("/courses/{courseCode}")
    public ResponseEntity<ApiResponse<CourseDto>> updateCourse(
            @PathVariable String courseCode,
            @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Course updated", courseService.updateCourse(courseCode, request)));
    }

    @DeleteMapping("/courses/{courseCode}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable String courseCode) {
        courseService.deleteCourse(courseCode);
        return ResponseEntity.ok(ApiResponse.success("Course deleted", null));
    }

    @GetMapping("/courses/{courseCode}/registrations")
    public ResponseEntity<ApiResponse<List<RegisteredCourseDto>>> getCourseRegistrations(
            @PathVariable String courseCode) {
        return ResponseEntity.ok(ApiResponse.success(
            "Course registrations retrieved",
            certificationService.getRegistrationsByCourse(courseCode)
        ));
    }

    @GetMapping("/courses/{courseCode}/export")
    public ResponseEntity<byte[]> exportCourseCertifications(@PathVariable String courseCode) {
        List<RegisteredCourseDto> data = certificationService.getRegistrationsByCourse(courseCode);
        byte[] excelBytes = excelExportService.exportCertifications(data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ));
        headers.setContentDispositionFormData("attachment", "course-" + courseCode + "-certifications.xlsx");
        headers.setContentLength(excelBytes.length);

        return ResponseEntity.ok().headers(headers).body(excelBytes);
    }

    // ─── Students ────────────────────────────────────────────────────────────

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<UserDto>>> getStudents() {
        return ResponseEntity.ok(ApiResponse.success("Students retrieved", userService.getAllStudents()));
    }

    @GetMapping("/students/{universityId}/certifications")
    public ResponseEntity<ApiResponse<List<RegisteredCourseDto>>> getStudentCertifications(
            @PathVariable String universityId) {
        return ResponseEntity.ok(ApiResponse.success(
            "Student certifications retrieved",
            certificationService.getStudentCertifications(universityId)
        ));
    }

    @GetMapping("/students/{universityId}/export")
    public ResponseEntity<byte[]> exportStudentCertifications(@PathVariable String universityId) {
        List<RegisteredCourseDto> data = certificationService.getStudentCertifications(universityId);
        byte[] excelBytes = excelExportService.exportCertifications(data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ));
        headers.setContentDispositionFormData("attachment", "student-" + universityId + "-certifications.xlsx");
        headers.setContentLength(excelBytes.length);

        return ResponseEntity.ok().headers(headers).body(excelBytes);
    }

    @PostMapping("/students")
    public ResponseEntity<ApiResponse<UserDto>> createStudent(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Student created", userService.createStudent(request)));
    }

    @PutMapping("/students/{universityId}")
    public ResponseEntity<ApiResponse<UserDto>> updateStudent(
            @PathVariable String universityId,
            @Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Student updated", userService.updateStudent(universityId, request)));
    }

    @DeleteMapping("/students/{universityId}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable String universityId) {
        userService.deleteStudent(universityId);
        return ResponseEntity.ok(ApiResponse.success("Student deleted", null));
    }

    // ─── Excel Export ─────────────────────────────────────────────────────────

    @GetMapping("/export/certifications")
    public ResponseEntity<byte[]> exportCertifications() {
        List<RegisteredCourseDto> data = certificationService.getAllForExport();
        byte[] excelBytes = excelExportService.exportCertifications(data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ));
        headers.setContentDispositionFormData("attachment", "klu-certifications.xlsx");
        headers.setContentLength(excelBytes.length);

        return ResponseEntity.ok().headers(headers).body(excelBytes);
    }
}
