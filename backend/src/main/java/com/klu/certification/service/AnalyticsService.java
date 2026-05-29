package com.klu.certification.service;

import com.klu.certification.dto.AnalyticsDto;
import com.klu.certification.entity.RegisteredCourse;
import com.klu.certification.repository.RegisteredCourseRepository;
import com.klu.certification.repository.UserRepository;
import com.klu.certification.service.AntiSpamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final RegisteredCourseRepository registeredCourseRepository;
    private final AntiSpamService antiSpamService;

    @Cacheable(value = "analytics", key = "'dashboard_analytics'")
    @Transactional(readOnly = true)
    public AnalyticsDto getDashboardAnalytics() {
        long totalStudents = userRepository.countStudents();
        long totalCertifications = registeredCourseRepository.count();
        long pendingRequests = registeredCourseRepository.countByStatus(RegisteredCourse.Status.PENDING);
        long approvedCertifications = registeredCourseRepository.countByStatus(RegisteredCourse.Status.APPROVED);
        long activeUsers = antiSpamService.getActiveUserCount();

        double approvalRate = totalCertifications > 0
                ? Math.round((double) approvedCertifications / totalCertifications * 10000.0) / 100.0
                : 0.0;

        List<Object[]> popularityRaw = registeredCourseRepository.findCoursePopularity();
        List<AnalyticsDto.CoursePopularityDto> coursePopularity = popularityRaw.stream()
                .limit(10)
                .map(row -> AnalyticsDto.CoursePopularityDto.builder()
                        .courseCode((String) row[0])
                        .courseTitle((String) row[1])
                        .count((Long) row[2])
                        .build())
                .collect(Collectors.toList());

        List<Object[]> topStudentsRaw = registeredCourseRepository
                .findTopStudents(PageRequest.of(0, 10));
        List<AnalyticsDto.TopStudentDto> topStudents = topStudentsRaw.stream()
                .map(row -> AnalyticsDto.TopStudentDto.builder()
                        .universityId((String) row[0])
                        .studentName((String) row[1])
                        .certificationCount((Long) row[2])
                        .build())
                .collect(Collectors.toList());

        return AnalyticsDto.builder()
                .totalStudents(totalStudents)
                .totalCertifications(totalCertifications)
                .pendingRequests(pendingRequests)
                .approvedCertifications(approvedCertifications)
                .approvalRate(approvalRate)
                .activeUsers(activeUsers)
                .coursePopularity(coursePopularity)
                .topStudents(topStudents)
                .build();
    }
}
