package com.hanghai.kchtg.vhf.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request DTO for approving or rejecting a VHF communication system.
 */
@Data
public class ApprovalRequest {

    @NotBlank(message = "Quyết định không được để trống")
    private String decision;

    private String reason;
}
