package com.klu.certification.repository;

import com.klu.certification.entity.RegisteredCourse;
import com.klu.certification.entity.RegisteredCourseId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegisteredCourseRepository extends JpaRepository<RegisteredCourse, RegisteredCourseId> {

    @Query("SELECT rc FROM RegisteredCourse rc WHERE TRIM(LOWER(rc.universityId)) = TRIM(LOWER(:universityId)) ORDER BY rc.submittedAt DESC")
    List<RegisteredCourse> findByUniversityIdIgnoreCaseOrderBySubmittedAtDesc(@Param("universityId") String universityId);

    List<RegisteredCourse> findByCourseCodeOrderBySubmittedAtDesc(String courseCode);

    @Query("SELECT rc FROM RegisteredCourse rc WHERE LOWER(rc.courseCode) = LOWER(:courseCode) ORDER BY rc.submittedAt DESC")
    List<RegisteredCourse> findByCourseCodeIgnoreCaseOrderBySubmittedAtDesc(@Param("courseCode") String courseCode);

    Page<RegisteredCourse> findByUniversityIdOrderBySubmittedAtDesc(String universityId, Pageable pageable);

    boolean existsByUniversityIdAndCourseCode(String universityId, String courseCode);

    Optional<RegisteredCourse> findByUniversityIdAndCourseCode(String universityId, String courseCode);

    @Query("SELECT rc FROM RegisteredCourse rc WHERE TRIM(LOWER(rc.universityId)) = TRIM(LOWER(:universityId)) AND TRIM(LOWER(rc.courseCode)) = TRIM(LOWER(:courseCode))")
    Optional<RegisteredCourse> findByUniversityIdIgnoreCaseAndCourseCodeIgnoreCase(
        @Param("universityId") String universityId,
        @Param("courseCode") String courseCode
    );

    long countByStatus(RegisteredCourse.Status status);

    @Query("SELECT rc FROM RegisteredCourse rc WHERE " +
           "LOWER(rc.universityId) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(rc.studentName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(rc.courseCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(rc.courseTitle) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<RegisteredCourse> searchAll(@Param("query") String query, Pageable pageable);

    @Query("SELECT rc FROM RegisteredCourse rc WHERE rc.status = :status AND (" +
           "LOWER(rc.universityId) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(rc.studentName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(rc.courseTitle) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<RegisteredCourse> searchByStatus(
        @Param("query") String query,
        @Param("status") RegisteredCourse.Status status,
        Pageable pageable
    );

    Page<RegisteredCourse> findByStatusOrderBySubmittedAtDesc(RegisteredCourse.Status status, Pageable pageable);

    Page<RegisteredCourse> findAllByOrderBySubmittedAtDesc(Pageable pageable);

    // Analytics queries
    @Query("SELECT rc.courseCode, rc.courseTitle, COUNT(rc) as cnt FROM RegisteredCourse rc " +
           "WHERE rc.status = 'APPROVED' GROUP BY rc.courseCode, rc.courseTitle ORDER BY cnt DESC")
    List<Object[]> findCoursePopularity();

    @Query("SELECT rc.universityId, rc.studentName, COUNT(rc) as cnt FROM RegisteredCourse rc " +
           "WHERE rc.status = 'APPROVED' GROUP BY rc.universityId, rc.studentName ORDER BY cnt DESC")
    List<Object[]> findTopStudents(Pageable pageable);

    @Query("SELECT COUNT(DISTINCT rc.universityId) FROM RegisteredCourse rc WHERE rc.status = 'APPROVED'")
    long countStudentsWithCertifications();

    boolean existsByCredlyLink(String credlyLink);

    @Query("SELECT rc FROM RegisteredCourse rc ORDER BY rc.submittedAt DESC")
    List<RegisteredCourse> findAllForExport();

    void deleteByUniversityId(String universityId);
}
