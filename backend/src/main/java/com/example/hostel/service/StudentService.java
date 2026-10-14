package com.example.hostel.service;

import com.example.hostel.entity.Student;
import com.example.hostel.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

/**
 * Service handling Student registration, authentication, and lookup logic
 */
@Service
public class StudentService {

    private final StudentRepository studentRepository;

    @Autowired
    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    /**
     * Register a new resident student
     */
    public Student registerStudent(Student student) {
        if (studentRepository.existsByStudentId(student.getStudentId())) {
            throw new IllegalArgumentException("Student ID " + student.getStudentId() + " is already registered.");
        }
        if (studentRepository.existsByEmail(student.getEmail())) {
            throw new IllegalArgumentException("Email " + student.getEmail() + " is already in use.");
        }
        return studentRepository.save(student);
    }

    /**
     * Authenticate student using Email/ID and Password
     */
    public Student loginStudent(String identifier, String password) {
        Optional<Student> studentOpt = studentRepository.findByStudentIdOrEmail(identifier, identifier);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            if (student.getPassword().equals(password)) {
                return student;
            }
        }
        throw new IllegalArgumentException("Invalid Student ID/Email or password.");
    }

    /**
     * Get student by Student ID
     */
    public Optional<Student> getStudentById(String studentId) {
        return studentRepository.findByStudentId(studentId);
    }

    /**
     * Get all registered students
     */
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    /**
     * Count total registered students
     */
    public long countStudents() {
        return studentRepository.count();
    }
}
