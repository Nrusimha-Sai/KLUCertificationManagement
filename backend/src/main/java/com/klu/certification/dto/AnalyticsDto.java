package com.klu.certification.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto {
    private long totalStudents;
    private long totalCertifications;
    private long pendingRequests;
    private long approvedCertifications;
    private long rejectedCertifications;
    private double approvalRate;
    private long activeUsers;
    private List<CoursePopularityDto> coursePopularity;
    private List<TopStudentDto> topStudents;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CoursePopularityDto {
        private String courseCode;
        private String courseTitle;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopStudentDto {
        private String universityId;
        private String studentName;
        private long certificationCount;
    }
}
