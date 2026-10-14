package com.example.hostel.repository;

import com.example.hostel.entity.Emergency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Spring Data JPA Repository for Emergency operations
 */
@Repository
public interface EmergencyRepository extends JpaRepository<Emergency, Long> {
    List<Emergency> findByStudentIdOrderByDateTimeDesc(String studentId);
    List<Emergency> findByStatusOrderByDateTimeDesc(String status);
    List<Emergency> findAllByOrderByDateTimeDesc();
    long countByStatus(String status);
}
