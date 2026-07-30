package com.hanghai.kchtg.radarstation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {
    @NotBlank(message = "Quyết định phê duyệt không được để trống")
    private String quyetDinh;

    private String reason;
}
