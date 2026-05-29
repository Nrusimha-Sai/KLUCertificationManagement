package com.klu.certification.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDto {
    private String id;
    private String courseCode;
    private String courseTitle;
}
