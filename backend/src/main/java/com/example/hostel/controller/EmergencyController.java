package com.example.hostel.controller;

import com.example.hostel.entity.Emergency;
import com.example.hostel.service.EmergencyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Emergency Alert Reporting and Status Management
 */
@RestController
@RequestMapping("/api/emergencies")
@CrossOrigin(origins = "*")
public class EmergencyController {

    private final EmergencyService emergencyService;

    @Autowired
    public EmergencyController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    /**
     * POST /api/emergencies
     * Submit an emergency report (sets initial status to Pending)
     */
    @PostMapping
    public ResponseEntity<?> reportEmergency(@Valid @RequestBody Emergency emergency) {
        try {
            Emergency saved = emergencyService.reportEmergency(emergency);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/emergencies
     * Retrieve all emergencies (or by studentId query param if provided)
     */
    @GetMapping
    public ResponseEntity<List<Emergency>> getEmergencies(@RequestParam(required = false) String studentId) {
        if (studentId != null && !studentId.isBlank()) {
            return ResponseEntity.ok(emergencyService.getEmergenciesByStudentId(studentId));
        }
        return ResponseEntity.ok(emergencyService.getAllEmergencies());
    }

    /**
     * GET /api/emergencies/{id}
     * Retrieve specific emergency details
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getEmergencyById(@PathVariable Long id) {
        return emergencyService.getEmergencyById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * PUT /api/emergencies/{id}/status
     * Admin/Warden updates emergency status (Pending, In Progress, Resolved)
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateEmergencyStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate) {
        String newStatus = statusUpdate.get("status");
        String remarks = statusUpdate.get("remarks");

        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status field is required (Pending, In Progress, Resolved)."));
        }

        try {
            Emergency updated = emergencyService.updateEmergencyStatus(id, newStatus, remarks);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update status."));
        }
    }
}
