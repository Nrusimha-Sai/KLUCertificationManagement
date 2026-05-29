package com.klu.certification.service;

import com.klu.certification.dto.CourseDto;
import com.klu.certification.dto.CourseRequest;
import com.klu.certification.entity.Course;
import com.klu.certification.exception.BusinessException;
import com.klu.certification.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    @Cacheable(value = "courses", key = "'all_courses'")
    @Transactional(readOnly = true)
    public List<CourseDto> getAllCourses() {
        return courseRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public CourseDto createCourse(CourseRequest request) {
        if (courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw BusinessException.conflict("Course with code '" + request.getCourseCode() + "' already exists");
        }
        Course course = Course.builder()
                .courseCode(request.getCourseCode().toUpperCase())
                .courseTitle(request.getCourseTitle())
                .build();
        return mapToDto(courseRepository.save(course));
    }

    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public CourseDto updateCourse(String courseCode, CourseRequest request) {
        Course course = courseRepository.findById(courseCode)
                .orElseThrow(() -> BusinessException.notFound("Course not found"));
        course.setCourseTitle(request.getCourseTitle());
        return mapToDto(courseRepository.save(course));
    }

    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public void deleteCourse(String courseCode) {
        if (!courseRepository.existsById(courseCode)) {
            throw BusinessException.notFound("Course not found");
        }
        courseRepository.deleteById(courseCode);
        log.info("Course {} deleted", courseCode);
    }

    private CourseDto mapToDto(Course course) {
        return CourseDto.builder()
                .id(course.getCourseCode())
                .courseCode(course.getCourseCode())
                .courseTitle(course.getCourseTitle())
                .build();
    }
}
