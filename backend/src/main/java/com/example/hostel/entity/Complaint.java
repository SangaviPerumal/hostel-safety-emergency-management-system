package com.example.hostel.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a Safety Complaint in MySQL
 */
@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Student ID is required")
    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "hostel_name")
    private String hostelName = "Chellammal hostel";

    @NotBlank(message = "Room number is required")
    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @NotBlank(message = "Complaint type is required")
    @Column(name = "complaint_type", nullable = false)
    private String complaintType;

    @NotBlank(message = "Description is required")
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "status", nullable = false)
    private String status = "Pending";

    @Column(name = "date_time")
    private LocalDateTime dateTime;

    @Column(name = "admin_remarks")
    private String adminRemarks;

    @Column(name = "alert_recipients")
    private String alertRecipients;

    public Complaint() {
    }

    public Complaint(String studentId, String hostelName, String roomNumber, String complaintType, String description) {
        this.studentId = studentId;
        this.hostelName = hostelName != null ? hostelName : "Chellammal hostel";
        this.roomNumber = roomNumber;
        this.complaintType = complaintType;
        this.description = description;
        this.status = "Pending";
    }

    @PrePersist
    protected void onCreate() {
        if (this.dateTime == null) {
            this.dateTime = LocalDateTime.now();
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "Pending";
        }
        if (this.alertRecipients == null || this.alertRecipients.isBlank()) {
            this.alertRecipients = assignDefaultComplaintRecipients();
        }
    }

    private String assignDefaultComplaintRecipients() {
        String typ = this.complaintType != null ? this.complaintType.toLowerCase() : "";
        if (typ.contains("plumb") || typ.contains("water") || typ.contains("pipe")) {
            return "Plumber, Dr. Sumathi (Hostel Warden) and Hostel Management";
        } else if (typ.contains("light") || typ.contains("wiring") || typ.contains("socket")) {
            return "Electrician, Dr. Sumathi (Chief Warden) and Hostel Management";
        } else {
            return "Dr. Sumathi (Hostel Warden) and Hostel Management";
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getHostelName() {
        return hostelName;
    }

    public void setHostelName(String hostelName) {
        this.hostelName = hostelName;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getComplaintType() {
        return complaintType;
    }

    public void setComplaintType(String complaintType) {
        this.complaintType = complaintType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public String getAdminRemarks() {
        return adminRemarks;
    }

    public void setAdminRemarks(String adminRemarks) {
        this.adminRemarks = adminRemarks;
    }

    public String getAlertRecipients() {
        return alertRecipients;
    }

    public void setAlertRecipients(String alertRecipients) {
        this.alertRecipients = alertRecipients;
    }
}
