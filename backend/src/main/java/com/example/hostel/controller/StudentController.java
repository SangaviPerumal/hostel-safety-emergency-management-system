package com.example.hostel.controller;

import com.example.hostel.entity.Student;
import com.example.hostel.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Student Registration, Login, and Lookup
 */
@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    @Autowired
    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    /**
     * POST /api/students/register
     * Register a new resident student
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerStudent(@Valid @RequestBody Student student) {
        try {
            Student savedStudent = studentService.registerStudent(student);
            return new ResponseEntity<>(savedStudent, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error during registration."));
        }
    }

    /**
     * POST /api/students/login
     * Validate student login credentials
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginStudent(@RequestBody Map<String, String> loginRequest) {
        String identifier = loginRequest.get("identifier");
        if (identifier == null || identifier.isBlank()) {
            identifier = loginRequest.get("studentId");
        }
        if (identifier == null || identifier.isBlank()) {
            identifier = loginRequest.get("email");
        }
        String password = loginRequest.get("password");

        if (identifier == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Identifier and password are required."));
        }

        try {
            Student student = studentService.loginStudent(identifier, password);
            return ResponseEntity.ok(student);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/students
     * Get all registered students (used by Warden/Admin dashboard)
     */
    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    /**
     * GET /api/students/{id}
     * Lookup student by student ID
     */
    @GetMapping("/{studentId}")
    public ResponseEntity<?> getStudentById(@PathVariable String studentId) {
        return studentService.getStudentById(studentId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
