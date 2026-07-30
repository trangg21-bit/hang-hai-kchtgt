package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body for POST /api/roles/{id}/permissions.
 * <p>
 * Wraps {@code List<String>} to work around Java generic type erasure,
 * which prevents Jackson from correctly deserializing a bare {@code @RequestBody List<String>}
 * (it tries to coerce the array into a single String token).
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignPermissionsRequest {

    /** List of permission codes to assign to the role (e.g. {@code "system:read"}). */
    @NotEmpty(message = "Danh sách permission codes không được để trống")
    private List<String> permissionCodes;

}
