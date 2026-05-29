package com.klu.certification.repository;

import com.klu.certification.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByUniversityId(String universityId);

    boolean existsByUniversityId(String universityId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'STUDENT'")
    long countStudents();

    java.util.List<User> findByRoleOrderByUniversityIdAsc(User.Role role);
}
