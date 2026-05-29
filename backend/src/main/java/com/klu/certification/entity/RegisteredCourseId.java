package com.klu.certification.entity;

import java.io.Serializable;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisteredCourseId implements Serializable {
    private String universityId;
    private String courseCode;
}
