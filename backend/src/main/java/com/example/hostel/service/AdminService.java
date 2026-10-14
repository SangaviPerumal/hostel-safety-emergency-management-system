package com.example.hostel.service;

import com.example.hostel.entity.Admin;
import com.example.hostel.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Service managing Warden / Admin authentication and dashboard stats
 */
@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final StudentService studentService;
    private final EmergencyService emergencyService;
    private final ComplaintService complaintService;

    @Autowired
    public AdminService(AdminRepository adminRepository,
                        StudentService studentService,
                        EmergencyService emergencyService,
                        ComplaintService complaintService) {
        this.adminRepository = adminRepository;
        this.studentService = studentService;
        this.emergencyService = emergencyService;
        this.complaintService = complaintService;
    }

    /**
     * Authenticate Warden / Admin
     */
    public Admin loginAdmin(String username, String password) {
        Optional<Admin> adminOpt = adminRepository.findByUsername(username);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (admin.getPassword().equals(password)) {
                return admin;
            }
        }
        throw new IllegalArgumentException("Invalid admin username or password.");
    }

    /**
     * Fetch aggregated statistics for Feature 7 Admin Dashboard
     */
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", studentService.countStudents());
        stats.put("totalEmergencies", emergencyService.countAllEmergencies());
        stats.put("pendingEmergencies", emergencyService.countPendingEmergencies());
        stats.put("resolvedEmergencies", emergencyService.countResolvedEmergencies());
        stats.put("totalComplaints", complaintService.countAllComplaints());
        stats.put("pendingComplaints", complaintService.countPendingComplaints());
        return stats;
    }
}
