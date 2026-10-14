package com.example.hostel.service;

import com.example.hostel.entity.Complaint;
import com.example.hostel.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service managing Safety Complaints and maintenance resolution
 */
@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;

    @Autowired
    public ComplaintService(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    /**
     * Submit a new safety complaint (Initial status: Pending)
     */
    public Complaint submitComplaint(Complaint complaint) {
        if (complaint.getStatus() == null || complaint.getStatus().isBlank()) {
            complaint.setStatus("Pending");
        }
        if (complaint.getDateTime() == null) {
            complaint.setDateTime(LocalDateTime.now());
        }
        if (complaint.getAlertRecipients() == null || complaint.getAlertRecipients().isBlank()) {
            String typ = complaint.getComplaintType() != null ? complaint.getComplaintType().toLowerCase() : "";
            if (typ.contains("plumb") || typ.contains("water") || typ.contains("pipe")) {
                complaint.setAlertRecipients("Plumber (1234567890), Hostel Warden (7305004032) and Hostel Management (8148850319)");
            } else if (typ.contains("light") || typ.contains("wiring") || typ.contains("socket")) {
                complaint.setAlertRecipients("Electrician (1357924680), Chief Warden (7305004032) and Hostel Management (8148850319)");
            } else {
                complaint.setAlertRecipients("Hostel Warden (7305004032) and Hostel Management (8148850319)");
            }
        }
        return complaintRepository.save(complaint);
    }

    /**
     * Get all complaints sorted by newest first
     */
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAllByOrderByDateTimeDesc();
    }

    /**
     * Get complaint by ID
     */
    public Optional<Complaint> getComplaintById(Long id) {
        return complaintRepository.findById(id);
    }

    /**
     * Get complaints by student ID
     */
    public List<Complaint> getComplaintsByStudentId(String studentId) {
        return complaintRepository.findByStudentIdOrderByDateTimeDesc(studentId);
    }

    /**
     * Update complaint status (Pending, In Progress, Resolved)
     */
    public Complaint updateComplaintStatus(Long id, String newStatus, String remarks) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found with ID: " + id));

        complaint.setStatus(newStatus);
        if (remarks != null && !remarks.isBlank()) {
            complaint.setAdminRemarks(remarks);
        }
        return complaintRepository.save(complaint);
    }

    /**
     * Metrics
     */
    public long countAllComplaints() {
        return complaintRepository.count();
    }

    public long countPendingComplaints() {
        return complaintRepository.countByStatus("Pending");
    }
}
