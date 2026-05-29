package com.klu.certification.service;

import com.klu.certification.dto.StudentRequest;
import com.klu.certification.dto.UserDto;
import com.klu.certification.entity.User;
import com.klu.certification.exception.BusinessException;
import com.klu.certification.repository.RegisteredCourseRepository;
import com.klu.certification.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RegisteredCourseRepository registeredCourseRepository;

    @Transactional(readOnly = true)
    public List<UserDto> getAllStudents() {
        return userRepository.findByRoleOrderByUniversityIdAsc(User.Role.STUDENT)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto createStudent(StudentRequest request) {
        if (userRepository.existsByUniversityId(request.getUniversityId())) {
            throw BusinessException.conflict("Student with University ID " + request.getUniversityId() + " already exists");
        }

        if (request.getSecurityCode() == null || request.getSecurityCode().isBlank()) {
            throw BusinessException.badRequest("Security code is required for new students");
        }

        User student = User.builder()
                .universityId(request.getUniversityId())
                .name(request.getName())
                .email(request.getEmail())
                .dept(request.getDept())
                .securityCode(request.getSecurityCode())
                .role(User.Role.STUDENT)
                .build();

        User saved = userRepository.save(student);
        log.info("Student created: {}", saved.getUniversityId());
        return mapToDto(saved);
    }

    @Transactional
    public UserDto updateStudent(String universityId, StudentRequest request) {
        User student = userRepository.findByUniversityId(universityId)
                .orElseThrow(() -> BusinessException.notFound("Student not found"));

        if (student.getRole() != User.Role.STUDENT) {
            throw BusinessException.forbidden("Cannot edit an administrator via student management panel");
        }

        student.setName(request.getName());
        student.setEmail(request.getEmail());
        student.setDept(request.getDept());

        if (request.getSecurityCode() != null && !request.getSecurityCode().isBlank()) {
            student.setSecurityCode(request.getSecurityCode());
        }

        User saved = userRepository.save(student);
        log.info("Student updated: {}", saved.getUniversityId());
        return mapToDto(saved);
    }

    @Transactional
    public void deleteStudent(String universityId) {
        User student = userRepository.findByUniversityId(universityId)
                .orElseThrow(() -> BusinessException.notFound("Student not found"));

        if (student.getRole() != User.Role.STUDENT) {
            throw BusinessException.forbidden("Cannot delete an administrator via student management panel");
        }

        // Clean up registered courses first
        registeredCourseRepository.deleteByUniversityId(universityId);

        // Delete user
        userRepository.delete(student);
        log.info("Student and all their associated registrations deleted: {}", universityId);
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getUniversityId())
                .universityId(user.getUniversityId())
                .name(user.getName())
                .email(user.getEmail())
                .dept(user.getDept())
                .role(user.getRole())
                .blockedUntil(user.getBlockedUntil())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
