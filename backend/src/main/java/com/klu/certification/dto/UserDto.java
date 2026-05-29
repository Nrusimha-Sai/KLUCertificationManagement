package com.klu.certification.dto;

import com.klu.certification.entity.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto {
    private String id;
    private String universityId;
    private String name;
    private String email;
    private String dept;
    private User.Role role;
    private LocalDateTime blockedUntil;
    private LocalDateTime createdAt;
}
