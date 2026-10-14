package com.example.hostel.service;

import com.example.hostel.entity.Emergency;
import com.example.hostel.repository.EmergencyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service managing Emergency alerts and dispatch updates
 */
@Service
public class EmergencyService {

    private final EmergencyRepository emergencyRepository;

    @Autowired
    public EmergencyService(EmergencyRepository emergencyRepository) {
        this.emergencyRepository = emergencyRepository;
    }

    /**
     * Submit a new emergency report (Initial status: Pending)
     */
    public Emergency reportEmergency(Emergency emergency) {
        if (emergency.getStatus() == null || emergency.getStatus().isBlank()) {
            emergency.setStatus("Pending");
        }
        if (emergency.getDateTime() == null) {
            emergency.setDateTime(LocalDateTime.now());
        }
        if (emergency.getAlertRecipients() == null || emergency.getAlertRecipients().isBlank()) {
            String cat = emergency.getEmergencyCategory() != null ? emergency.getEmergencyCategory().toLowerCase() : "";
            if (cat.contains("medical")) {
                emergency.setAlertRecipients("Chief Warden (7305004032), Hostel Management (8148850319), Doctor and Nurse");
            } else if (cat.contains("electrical")) {
                emergency.setAlertRecipients("Electrician (1357924680), Chief Warden (7305004032) and Hostel Management (8148850319)");
            } else if (cat.contains("fire")) {
                emergency.setAlertRecipients("Hostel Warden (7305004032), Hostel Management (8148850319) and Fire Emergency Team");
            } else if (cat.contains("security")) {
                emergency.setAlertRecipients("Hostel Warden (7305004032), Hostel Management (8148850319), Hostel Security and Bouncers");
            } else {
                emergency.setAlertRecipients("Hostel Warden (7305004032) and Hostel Management (8148850319)");
            }
        }
        return emergencyRepository.save(emergency);
    }

    /**
     * Get all emergency reports sorted by newest first
     */
    public List<Emergency> getAllEmergencies() {
        return emergencyRepository.findAllByOrderByDateTimeDesc();
    }

    /**
     * Get emergency report by ID
     */
    public Optional<Emergency> getEmergencyById(Long id) {
        return emergencyRepository.findById(id);
    }

    /**
     * Get emergencies submitted by a specific student ID
     */
    public List<Emergency> getEmergenciesByStudentId(String studentId) {
        return emergencyRepository.findByStudentIdOrderByDateTimeDesc(studentId);
    }

    /**
     * Update emergency status (Pending, In Progress, Resolved)
     */
    public Emergency updateEmergencyStatus(Long id, String newStatus, String remarks) {
        Emergency emergency = emergencyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Emergency report not found with ID: " + id));

        emergency.setStatus(newStatus);
        if (remarks != null && !remarks.isBlank()) {
            emergency.setAdminRemarks(remarks);
        }
        return emergencyRepository.save(emergency);
    }

    /**
     * Metric counts
     */
    public long countAllEmergencies() {
        return emergencyRepository.count();
    }

    public long countPendingEmergencies() {
        return emergencyRepository.countByStatus("Pending");
    }

    public long countResolvedEmergencies() {
        return emergencyRepository.countByStatus("Resolved");
    }
}
