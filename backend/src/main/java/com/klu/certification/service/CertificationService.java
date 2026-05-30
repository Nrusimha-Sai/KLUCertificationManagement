package com.klu.certification.service;

import com.klu.certification.dto.AdminCreateCertificationRequest;
import com.klu.certification.dto.RegisteredCourseDto;
import com.klu.certification.dto.SubmitCertificationRequest;
import com.klu.certification.entity.Course;
import com.klu.certification.entity.RegisteredCourse;
import com.klu.certification.entity.RegisteredCourseId;
import com.klu.certification.entity.User;
import com.klu.certification.exception.BusinessException;
import com.klu.certification.repository.CourseRepository;
import com.klu.certification.repository.RegisteredCourseRepository;
import com.klu.certification.repository.UserRepository;
import com.klu.certification.socket.SocketEventEmitter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CertificationService {

    private final RegisteredCourseRepository registeredCourseRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final AntiSpamService antiSpamService;
    private final SocketEventEmitter socketEventEmitter;

    @Transactional
    @CacheEvict(value = {"analytics", "dashboard"}, allEntries = true)
    public RegisteredCourseDto submitCertification(String universityId, SubmitCertificationRequest request) {
        antiSpamService.checkRateLimit(universityId);

        User user = userRepository.findByUniversityId(universityId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));

        Course course = courseRepository.findByCourseCode(request.getCourseCode())
                .orElseThrow(() -> BusinessException.notFound("Course not found: " + request.getCourseCode()));

        String normalizedLink = validateAndNormalizeLink(request.getCredlyLink());

        // Check for duplicate course submission
        if (registeredCourseRepository.existsByUniversityIdAndCourseCode(universityId, request.getCourseCode())) {
            antiSpamService.checkAndRecordDuplicateSubmission(universityId, normalizedLink);
            throw BusinessException.conflict(
                "You have already submitted a certification for course: " + course.getCourseTitle()
            );
        }

        // Check for duplicate Credly link globally
        if (registeredCourseRepository.existsByCredlyLink(normalizedLink)) {
            antiSpamService.checkAndRecordDuplicateSubmission(universityId, normalizedLink);
            throw BusinessException.conflict(
                "This certification link has already been submitted by another student."
            );
        }

        RegisteredCourse registration = RegisteredCourse.builder()
                .universityId(universityId)
                .studentName(user.getName())
                .courseCode(course.getCourseCode())
                .courseTitle(course.getCourseTitle())
                .credlyLink(normalizedLink)
                .status(RegisteredCourse.Status.PENDING)
                .build();

        RegisteredCourse saved = registeredCourseRepository.save(registration);
        RegisteredCourseDto dto = mapToDto(saved);

        // Notify admins via WebSocket
        socketEventEmitter.emitNewSubmission(dto);
        socketEventEmitter.emitPendingCountUpdate();

        log.info("Certification submitted by {} for course {}", universityId, request.getCourseCode());
        return dto;
    }

    public String validateAndNormalizeLink(String rawLink) {
        if (rawLink == null || rawLink.trim().isEmpty()) {
            throw BusinessException.badRequest("Certification link is required");
        }

        String link = rawLink.trim();
        // Standardize protocol
        if (!link.startsWith("http://") && !link.startsWith("https://")) {
            link = "https://" + link;
        }

        URL url;
        try {
            // URL decode in case it was encoded
            link = URLDecoder.decode(link, StandardCharsets.UTF_8.name());
            url = new URL(link);
        } catch (Exception e) {
            throw BusinessException.badRequest("Invalid URL format. Must be a valid URL starting with http:// or https://");
        }

        String host = url.getHost().toLowerCase();
        
        // Prevent Google Drive & OneDrive
        if (host.contains("drive.google.com") || host.contains("docs.google.com") ||
            host.contains("onedrive.live.com") || host.contains("1drv.ms") ||
            host.contains("sharepoint.com")) {
            throw BusinessException.badRequest("Google Drive and OneDrive links are not allowed. Please submit a direct, publicly accessible certification link.");
        }

        // Clean link (strip trailing slash and unnecessary whitespaces)
        String cleanLink = url.getProtocol().toLowerCase() + "://" + url.getHost().toLowerCase() + url.getPath();
        if (url.getQuery() != null && !url.getQuery().isBlank()) {
            cleanLink += "?" + url.getQuery();
        }
        
        return cleanLink;
    }

    @Transactional
    @CacheEvict(value = {"analytics", "dashboard"}, allEntries = true)
    public RegisteredCourseDto approveCertification(String universityId, String courseCode) {
        RegisteredCourse registration = registeredCourseRepository.findByUniversityIdIgnoreCaseAndCourseCodeIgnoreCase(universityId, courseCode)
                .orElseThrow(() -> BusinessException.notFound("Certification request not found"));

        if (registration.getStatus() == RegisteredCourse.Status.APPROVED) {
            throw BusinessException.conflict("This certification is already approved");
        }

        registration.setStatus(RegisteredCourse.Status.APPROVED);
        registration.setVerifiedAt(LocalDateTime.now());
        RegisteredCourse saved = registeredCourseRepository.save(registration);
        RegisteredCourseDto dto = mapToDto(saved);

        // Notify student and all admins
        socketEventEmitter.emitCertificationApproved(dto);
        socketEventEmitter.emitPendingCountUpdate();
        socketEventEmitter.emitAnalyticsUpdate();

        log.info("Certification for {} / {} approved", universityId, courseCode);
        return dto;
    }

    @Transactional
    @CacheEvict(value = {"analytics", "dashboard"}, allEntries = true)
    public void rejectCertification(String universityId, String courseCode) {
        RegisteredCourse registration = registeredCourseRepository.findByUniversityIdIgnoreCaseAndCourseCodeIgnoreCase(universityId, courseCode)
                .orElseThrow(() -> BusinessException.notFound("Certification request not found"));

        registration.setStatus(RegisteredCourse.Status.REJECTED);
        registration.setVerifiedAt(LocalDateTime.now());
        registeredCourseRepository.save(registration);

        socketEventEmitter.emitCertificationRejected(universityId, courseCode);
        socketEventEmitter.emitPendingCountUpdate();
        socketEventEmitter.emitAnalyticsUpdate();

        log.info("Certification for {} / {} marked as REJECTED", universityId, courseCode);
    }

    @Transactional
    @CacheEvict(value = {"analytics", "dashboard"}, allEntries = true)
    public void deleteRejectedCertification(String universityId, String courseCode) {
        RegisteredCourse registration = registeredCourseRepository.findByUniversityIdIgnoreCaseAndCourseCodeIgnoreCase(universityId, courseCode)
                .orElseThrow(() -> BusinessException.notFound("Certification request not found"));

        if (!registration.getUniversityId().trim().equalsIgnoreCase(universityId.trim())) {
            throw BusinessException.forbidden("You are not authorized to delete this certification request");
        }

        if (registration.getStatus() != RegisteredCourse.Status.REJECTED) {
            throw BusinessException.badRequest("Only rejected certification requests can be deleted by the student");
        }

        registeredCourseRepository.delete(registration);
        socketEventEmitter.emitPendingCountUpdate();
        socketEventEmitter.emitAnalyticsUpdate();

        log.info("Student {} deleted rejected certification for {}", universityId, courseCode);
    }

    @Transactional(readOnly = true)
    public List<RegisteredCourseDto> getStudentCertifications(String universityId) {
        List<RegisteredCourse> rcs = registeredCourseRepository
                .findByUniversityIdIgnoreCaseOrderBySubmittedAtDesc(universityId);
        return mapToDtos(rcs);
    }

    @Transactional(readOnly = true)
    public Page<RegisteredCourseDto> getAllCertifications(String query, String status, Pageable pageable) {
        Page<RegisteredCourse> page;
        if (query != null && !query.isBlank() && status != null && !status.isBlank()) {
            RegisteredCourse.Status statusEnum = RegisteredCourse.Status.valueOf(status.toUpperCase());
            page = registeredCourseRepository.searchByStatus(query, statusEnum, pageable);
        } else if (query != null && !query.isBlank()) {
            page = registeredCourseRepository.searchAll(query, pageable);
        } else if (status != null && !status.isBlank()) {
            RegisteredCourse.Status statusEnum = RegisteredCourse.Status.valueOf(status.toUpperCase());
            page = registeredCourseRepository.findByStatusOrderBySubmittedAtDesc(statusEnum, pageable);
        } else {
            page = registeredCourseRepository.findAllByOrderBySubmittedAtDesc(pageable);
        }

        // Batch query all users on the page to solve the N+1 query problem
        List<RegisteredCourse> content = page.getContent();
        List<String> uids = content.stream()
                .map(RegisteredCourse::getUniversityId)
                .distinct()
                .collect(Collectors.toList());
        List<User> students = userRepository.findAllById(uids);
        Map<String, User> studentMap = students.stream()
                .collect(Collectors.toMap(User::getUniversityId, u -> u, (a, b) -> a));

        return page.map(rc -> mapToDtoWithMap(rc, studentMap));
    }

    @Transactional(readOnly = true)
    public List<RegisteredCourseDto> getAllForExport() {
        return mapToDtos(registeredCourseRepository.findAllForExport());
    }

    @Transactional(readOnly = true)
    public List<RegisteredCourseDto> getRegistrationsByCourse(String courseCode) {
        return mapToDtos(registeredCourseRepository.findByCourseCodeIgnoreCaseOrderBySubmittedAtDesc(courseCode));
    }

    @Transactional
    @CacheEvict(value = {"analytics", "dashboard"}, allEntries = true)
    public RegisteredCourseDto createCertificationManually(AdminCreateCertificationRequest request) {
        String universityId = request.getUniversityId().trim();
        String courseCode = request.getCourseCode().trim();
        String credlyLink = request.getCredlyLink().trim();

        User user = userRepository.findByUniversityId(universityId)
                .orElseThrow(() -> BusinessException.notFound("Student with University ID " + universityId + " not found"));

        if (user.getRole() != User.Role.STUDENT) {
            throw BusinessException.badRequest("Cannot submit certification for an administrator");
        }

        Course course = courseRepository.findByCourseCode(courseCode)
                .orElseThrow(() -> BusinessException.notFound("Course with code " + courseCode + " not found"));

        String normalizedLink = validateAndNormalizeLink(credlyLink);

        // Check duplicate submission for same course
        if (registeredCourseRepository.existsByUniversityIdAndCourseCode(universityId, courseCode)) {
            throw BusinessException.conflict("Student " + universityId + " has already submitted a certification for course: " + course.getCourseTitle());
        }

        // Check duplicate link globally
        if (registeredCourseRepository.existsByCredlyLink(normalizedLink)) {
            throw BusinessException.conflict("This certification link has already been submitted by another student.");
        }

        RegisteredCourse registration = RegisteredCourse.builder()
                .universityId(universityId)
                .studentName(user.getName())
                .courseCode(course.getCourseCode())
                .courseTitle(course.getCourseTitle())
                .credlyLink(normalizedLink)
                .status(request.getStatus())
                .verifiedAt(request.getStatus() != RegisteredCourse.Status.PENDING ? LocalDateTime.now() : null)
                .build();

        RegisteredCourse saved = registeredCourseRepository.save(registration);
        RegisteredCourseDto dto = mapToDto(saved);

        // Notify admins and student via WebSockets
        socketEventEmitter.emitNewSubmission(dto);
        if (request.getStatus() == RegisteredCourse.Status.APPROVED) {
            socketEventEmitter.emitCertificationApproved(dto);
        } else if (request.getStatus() == RegisteredCourse.Status.REJECTED) {
            socketEventEmitter.emitCertificationRejected(universityId, courseCode);
        }
        socketEventEmitter.emitPendingCountUpdate();
        socketEventEmitter.emitAnalyticsUpdate();

        log.info("Manual certification entry created by admin for student {} and course {}", universityId, courseCode);
        return dto;
    }

    private List<RegisteredCourseDto> mapToDtos(List<RegisteredCourse> rcs) {
        if (rcs == null || rcs.isEmpty()) {
            return List.of();
        }
        List<String> uids = rcs.stream()
                .map(RegisteredCourse::getUniversityId)
                .distinct()
                .collect(Collectors.toList());
        List<User> students = userRepository.findAllById(uids);
        Map<String, User> studentMap = students.stream()
                .collect(Collectors.toMap(User::getUniversityId, u -> u, (a, b) -> a));

        return rcs.stream()
                .map(rc -> mapToDtoWithMap(rc, studentMap))
                .collect(Collectors.toList());
    }

    private RegisteredCourseDto mapToDtoWithMap(RegisteredCourse rc, Map<String, User> studentMap) {
        String studentName = rc.getStudentName();
        String studentEmail = null;
        String studentDept = null;

        User student = studentMap != null ? studentMap.get(rc.getUniversityId()) : null;
        if (student != null) {
            studentName = student.getName();
            studentEmail = student.getEmail();
            studentDept = student.getDept();
        }

        return RegisteredCourseDto.builder()
                .id(rc.getUniversityId() + "_" + rc.getCourseCode())
                .universityId(rc.getUniversityId())
                .studentName(studentName)
                .studentEmail(studentEmail)
                .studentDept(studentDept)
                .courseCode(rc.getCourseCode())
                .courseTitle(rc.getCourseTitle())
                .credlyLink(rc.getCredlyLink())
                .status(rc.getStatus())
                .submittedAt(rc.getSubmittedAt())
                .verifiedAt(rc.getVerifiedAt())
                .build();
    }

    private RegisteredCourseDto mapToDto(RegisteredCourse rc) {
        String studentName = rc.getStudentName();
        String studentEmail = null;
        String studentDept = null;

        User student = userRepository.findById(rc.getUniversityId()).orElse(null);
        if (student != null) {
            studentName = student.getName();
            studentEmail = student.getEmail();
            studentDept = student.getDept();
        }

        return RegisteredCourseDto.builder()
                .id(rc.getUniversityId() + "_" + rc.getCourseCode())
                .universityId(rc.getUniversityId())
                .studentName(studentName)
                .studentEmail(studentEmail)
                .studentDept(studentDept)
                .courseCode(rc.getCourseCode())
                .courseTitle(rc.getCourseTitle())
                .credlyLink(rc.getCredlyLink())
                .status(rc.getStatus())
                .submittedAt(rc.getSubmittedAt())
                .verifiedAt(rc.getVerifiedAt())
                .build();
    }
}
