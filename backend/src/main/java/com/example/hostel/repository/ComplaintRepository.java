package com.example.hostel.repository;

import com.example.hostel.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Spring Data JPA Repository for Safety Complaint operations
 */
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByStudentIdOrderByDateTimeDesc(String studentId);
    List<Complaint> findByStatusOrderByDateTimeDesc(String status);
    List<Complaint> findAllByOrderByDateTimeDesc();
    long countByStatus(String status);
}
