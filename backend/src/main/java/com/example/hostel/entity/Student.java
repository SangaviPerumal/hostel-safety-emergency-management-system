package com.example.hostel.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

/**
 * Student Entity representing hostel resident students
 * Maps to MySQL 'students' table
 */
@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Student name is required")
    @Column(name = "student_name", nullable = false)
    private String studentName;

    @NotBlank(message = "Student ID is required")
    @Column(name = "student_id", nullable = false, unique = true)
    private String studentId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @NotBlank(message = "Phone number is required")
    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Column(name = "password", nullable = false)
    private String password;

    @NotBlank(message = "Hostel name is required")
    @Column(name = "hostel_name", nullable = false)
    private String hostelName;

    @NotBlank(message = "Room number is required")
    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Student() {
    }

    public Student(String studentName, String studentId, String email, String phoneNumber, String password, String hostelName, String roomNumber) {
        this.studentName = studentName;
        this.studentId = studentId;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.password = password;
        this.hostelName = hostelName;
        this.roomNumber = roomNumber;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
