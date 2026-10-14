package com.example.hostel.controller;

import com.example.hostel.entity.Admin;
import com.example.hostel.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * REST Controller for Admin / Warden Login and Dashboard Analytics
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    @Autowired
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * POST /api/admin/login
     * Authenticate Admin / Warden
     */
    @PostMapping("/admin/login")
    public ResponseEntity<?> loginAdmin(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        if (username == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Username and password are required."));
        }

        try {
            Admin admin = adminService.loginAdmin(username, password);
            return ResponseEntity.ok(admin);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/dashboard/stats
     * Return counts for Feature 7 Admin Dashboard
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }
}
