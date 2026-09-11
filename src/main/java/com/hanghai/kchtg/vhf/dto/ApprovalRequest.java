package com.hanghai.kchtg.vhf.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for approving or rejecting a VHF communication system.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {

    @NotBlank(message = "Quyết định không được để trống")
    private String decision;

    private String reason;
}
