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
import org.springframework.beans.factory.annotation.Value;
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
    private final boolean demoDataEnabled;
    private final String adminUsername;
    private final String adminPassword;
    private final String adminName;

    @Autowired
    public DataInitializer(AdminRepository adminRepository,
                           StudentRepository studentRepository,
                           EmergencyRepository emergencyRepository,
                           ComplaintRepository complaintRepository,
                           @Value("${app.demo-data.enabled:true}") boolean demoDataEnabled,
                           @Value("${hostel.admin.username:admin@hostel.edu}") String adminUsername,
                           @Value("${hostel.admin.password:admin123}") String adminPassword,
                           @Value("${hostel.admin.name:Chief Warden}") String adminName) {
        this.adminRepository = adminRepository;
        this.studentRepository = studentRepository;
        this.emergencyRepository = emergencyRepository;
        this.complaintRepository = complaintRepository;
        this.demoDataEnabled = demoDataEnabled;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.adminName = adminName;
    }

    @Override
    public void run(String... args) {
        if (adminRepository.count() == 0) {
            if (adminUsername.isBlank() || adminPassword.isBlank()) {
                throw new IllegalStateException(
                        "Set HOSTEL_ADMIN_USERNAME and HOSTEL_ADMIN_PASSWORD before starting with an empty production database.");
            }
            Admin defaultAdmin = new Admin(adminUsername, adminPassword, adminName, "ADMIN");
            adminRepository.save(defaultAdmin);
            System.out.println(">>> Seeded warden account: " + adminUsername);
        }

        if (demoDataEnabled && studentRepository.count() == 0) {
            Student s1 = new Student("Sangavi Perumal", "STU101", "sangavi@hostel.edu", "+91 98765 43210", "password123", "Chellammal hostel", "G1");
            Student s2 = new Student("Rahul Sharma", "STU102", "rahul@hostel.edu", "+91 98765 11223", "password123", "Sivasakthi hostel", "S1");
            studentRepository.save(s1);
            studentRepository.save(s2);

            // Sample emergency
            Emergency e1 = new Emergency("Sangavi Perumal", "STU101", "Chellammal hostel", "Medical Emergency", "Sudden Severe Illness", "G1", "High fever with breathing difficulty.");
            emergencyRepository.save(e1);

            // Sample complaint
            Complaint c1 = new Complaint("STU101", "Chellammal hostel", "G1", "Broken Door Lock / Window Latch", "Main door latch is loose.");
            complaintRepository.save(c1);
            
            System.out.println(">>> Seeded demo students and emergency records.");
        }
    }
}
