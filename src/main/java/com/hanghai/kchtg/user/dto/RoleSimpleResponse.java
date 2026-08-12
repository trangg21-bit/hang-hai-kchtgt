package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Lightweight DTO for role dropdowns — only id, name, code.
 * No permissions, no menuCodes, no userCount.
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class RoleSimpleResponse {
    private String id;
    private String name;
    private String code;

    public RoleSimpleResponse(UUID id, String name, String code) {
        this.id = id != null ? id.toString() : null;
        this.name = name;
        this.code = code;
    }
}
