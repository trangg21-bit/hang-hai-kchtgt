package com.hanghai.kchtg.admin.dto;

import com.hanghai.kchtg.admin.entity.AdminAccount;
import com.hanghai.kchtg.admin.entity.AdminRole;
import com.hanghai.kchtg.admin.entity.AdminStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class AdminResponse {

    private UUID id;
    private UUID userId;
    private String username;
    private AdminRole role;
    private List<String> modules;
    private String email;
    private String fullName;
    private String phone;
    private AdminStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminResponse from(AdminAccount entity) {
        return AdminResponse.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .username(entity.getUser().getUsername())
                .email(entity.getUser().getEmail())
                .fullName(entity.getUser().getFullName())
                .phone(entity.getUser().getPhone())
                .role(entity.getRole())
                .modules(entity.getModules() != null ? new java.util.ArrayList<>(entity.getModules()) : List.of())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}