package com.example.hostel.entity;

/**
 * Status values for Emergency Reports and Safety Complaints
 */
public enum Status {
    Pending,
    In_Progress,
    Resolved;

    public static Status fromString(String text) {
        if (text == null) return Pending;
        String normalized = text.trim().replace(" ", "_").replace("-", "_");
        for (Status s : Status.values()) {
            if (s.name().equalsIgnoreCase(normalized)) {
                return s;
            }
        }
        return Pending;
    }
}
