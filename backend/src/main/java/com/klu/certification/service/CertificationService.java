package com.klu.certification.service;

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

import java.time.LocalDateTime;
import java.util.List;
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

        // Check for duplicate course submission
        if (registeredCourseRepository.existsByUniversityIdAndCourseCode(universityId, request.getCourseCode())) {
            antiSpamService.checkAndRecordDuplicateSubmission(universityId, request.getCredlyLink());
            throw BusinessException.conflict(
                "You have already submitted a certification for course: " + course.getCourseTitle()
            );
        }

        // Check for duplicate Credly link globally
        if (registeredCourseRepository.existsByCredlyLink(request.getCredlyLink())) {
            antiSpamService.checkAndRecordDuplicateSubmission(universityId, request.getCredlyLink());
            throw BusinessException.conflict(
                "This Credly certification link has already been submitted by another student."
            );
        }

        RegisteredCourse registration = RegisteredCourse.builder()
                .universityId(universityId)
                .studentName(user.getName())
                .courseCode(course.getCourseCode())
                .courseTitle(course.getCourseTitle())
                .credlyLink(request.getCredlyLink())
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
        return registeredCourseRepository
                .findByUniversityIdIgnoreCaseOrderBySubmittedAtDesc(universityId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
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
        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<RegisteredCourseDto> getAllForExport() {
        return registeredCourseRepository.findAllForExport()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RegisteredCourseDto> getRegistrationsByCourse(String courseCode) {
        return registeredCourseRepository.findByCourseCodeIgnoreCaseOrderBySubmittedAtDesc(courseCode)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private RegisteredCourseDto mapToDto(RegisteredCourse rc) {
        String studentName = rc.getStudentName();
        String studentEmail = null;
        String studentDept = null;

        User student = userRepository.findByUniversityId(rc.getUniversityId()).orElse(null);
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
