package com.klu.certification.repository;

import com.klu.certification.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {

    Optional<Course> findByCourseCode(String courseCode);

    boolean existsByCourseCode(String courseCode);

    @Query("SELECT c FROM Course c WHERE LOWER(c.courseTitle) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.courseCode) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Course> searchCourses(@Param("query") String query, Pageable pageable);

    List<Course> findAllByOrderByCreatedAtDesc();
}
