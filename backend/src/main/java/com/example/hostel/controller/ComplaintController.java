package com.example.hostel.controller;

import com.example.hostel.entity.Complaint;
import com.example.hostel.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Safety Complaints and Status Updates
 */
@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    private final ComplaintService complaintService;

    @Autowired
    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    /**
     * POST /api/complaints
     * Submit a new safety complaint (sets status to Pending)
     */
    @PostMapping
    public ResponseEntity<?> submitComplaint(@Valid @RequestBody Complaint complaint) {
        try {
            Complaint saved = complaintService.submitComplaint(complaint);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/complaints
     * Retrieve all complaints (or filter by studentId)
     */
    @GetMapping
    public ResponseEntity<List<Complaint>> getComplaints(@RequestParam(required = false) String studentId) {
        if (studentId != null && !studentId.isBlank()) {
            return ResponseEntity.ok(complaintService.getComplaintsByStudentId(studentId));
        }
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    /**
     * GET /api/complaints/{id}
     * Retrieve single complaint by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaintById(@PathVariable Long id) {
        return complaintService.getComplaintById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * PUT /api/complaints/{id}/status
     * Update complaint status (Pending, In Progress, Resolved)
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateComplaintStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate) {
        String newStatus = statusUpdate.get("status");
        String remarks = statusUpdate.get("remarks");

        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status field is required (Pending, In Progress, Resolved)."));
        }

        try {
            Complaint updated = complaintService.updateComplaintStatus(id, newStatus, remarks);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update complaint status."));
        }
    }
}
