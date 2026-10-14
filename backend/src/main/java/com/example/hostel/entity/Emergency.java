package com.example.hostel.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

/**
 * JPA Entity representing an Emergency Incident Report in MySQL
 */
@Entity
@Table(name = "emergencies")
public class Emergency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Student name is required")
    @Column(name = "student_name", nullable = false)
    private String studentName;

    @NotBlank(message = "Student ID is required")
    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "hostel_name")
    private String hostelName = "Chellammal hostel";

    @Column(name = "emergency_category")
    private String emergencyCategory;

    @NotBlank(message = "Emergency type is required")
    @Column(name = "emergency_type", nullable = false)
    private String emergencyType;

    @NotBlank(message = "Room number is required")
    @Column(name = "room_number", nullable = false)
    private String roomNumber;

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

    public Emergency() {
    }

    public Emergency(String studentName, String studentId, String hostelName, String emergencyCategory, String emergencyType, String roomNumber, String description) {
        this.studentName = studentName;
        this.studentId = studentId;
        this.hostelName = hostelName != null ? hostelName : "Chellammal hostel";
        this.emergencyCategory = emergencyCategory;
        this.emergencyType = emergencyType;
        this.roomNumber = roomNumber;
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
            this.alertRecipients = assignDefaultRecipients();
        }
    }

    private String assignDefaultRecipients() {
        String cat = this.emergencyCategory != null ? this.emergencyCategory.toLowerCase() : "";
        String typ = this.emergencyType != null ? this.emergencyType.toLowerCase() : "";
        if (cat.contains("medical") || typ.contains("medical") || typ.contains("injury") || typ.contains("illness")) {
            return "Dr. Sumathi (Chief Warden), Hostel Management, Doctor and Nurse";
        } else if (cat.contains("electrical") || typ.contains("electrical") || typ.contains("spark") || typ.contains("wire")) {
            return "Electrician, Dr. Sumathi (Chief Warden) and Hostel Management";
        } else if (cat.contains("fire") || typ.contains("fire") || typ.contains("flame") || typ.contains("smoke")) {
            return "Dr. Sumathi (Hostel Warden), Hostel Management and Fire Emergency Team";
        } else if (cat.contains("security") || typ.contains("security") || typ.contains("intruder")) {
            return "Dr. Sumathi (Hostel Warden), Hostel Management, Hostel Security and Bouncers";
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

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
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

    public String getEmergencyCategory() {
        return emergencyCategory;
    }

    public void setEmergencyCategory(String emergencyCategory) {
        this.emergencyCategory = emergencyCategory;
    }

    public String getEmergencyType() {
        return emergencyType;
    }

    public void setEmergencyType(String emergencyType) {
        this.emergencyType = emergencyType;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
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
