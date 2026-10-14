package com.example.hostel.config;

import com.example.hostel.entity.Admin;
import com.example.hostel.entity.Complaint;
import com.example.hostel.entity.Emergency;
import com.example.hostel.entity.Student;
import com.example.hostel.repository.AdminRepository;
import com.example.hostel.repository.ComplaintRepository;
import com.example.hostel.repository.EmergencyRepository;
import com.example.hostel.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Initializes default Admin and demo records when application starts
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final StudentRepository studentRepository;
    private final EmergencyRepository emergencyRepository;
    private final ComplaintRepository complaintRepository;

    @Autowired
    public DataInitializer(AdminRepository adminRepository,
                           StudentRepository studentRepository,
                           EmergencyRepository emergencyRepository,
                           ComplaintRepository complaintRepository) {
        this.adminRepository = adminRepository;
        this.studentRepository = studentRepository;
        this.emergencyRepository = emergencyRepository;
        this.complaintRepository = complaintRepository;
    }

    @Override
    public void run(String... args) {
        // Seed default Admin
        if (adminRepository.count() == 0) {
            Admin defaultAdmin = new Admin("admin@hostel.edu", "admin123", "Dr. R. Natarajan (Chief Warden)", "ADMIN");
            adminRepository.save(defaultAdmin);
            System.out.println(">>> Seeded default admin: admin@hostel.edu / admin123");
        }

        // Seed demo student if none exists
        if (studentRepository.count() == 0) {
            Student s1 = new Student("Sangavi Perumal", "STU101", "sangavi@hostel.edu", "+91 98765 43210", "password123", "Emerald Block (Girls Hostel)", "B-214");
            Student s2 = new Student("Rahul Sharma", "STU102", "rahul@hostel.edu", "+91 98765 11223", "password123", "Sapphire Block (Boys Hostel)", "A-105");
            studentRepository.save(s1);
            studentRepository.save(s2);

            // Sample emergency
            Emergency e1 = new Emergency("Sangavi Perumal", "STU101", "Medical Emergency", "Sudden Severe Illness", "B-214", "High fever with breathing difficulty.");
            e1.setStatus("Pending");
            emergencyRepository.save(e1);

            // Sample complaint
            Complaint c1 = new Complaint("STU101", "B-214", "Broken Door Lock / Window Latch", "Main door latch is loose.");
            c1.setStatus("Pending");
            complaintRepository.save(c1);
            
            System.out.println(">>> Seeded demo students and emergency records.");
        }
    }
}
