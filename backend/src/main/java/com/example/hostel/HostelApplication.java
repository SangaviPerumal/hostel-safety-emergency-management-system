package com.example.hostel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot Application Entry Point for Hostel Safety & Emergency Management System
 */
@SpringBootApplication
public class HostelApplication {

    public static void main(String[] args) {
        SpringApplication.run(HostelApplication.class, args);
        System.out.println("==========================================================");
        System.out.println("🚨 Hostel Emergency & Safety Management System is RUNNING!");
        System.out.println("REST API Base URL: http://localhost:8080/api");
        System.out.println("==========================================================");
    }
}
