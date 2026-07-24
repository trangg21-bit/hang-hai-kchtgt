package com.hanghai.kchtg.vts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {

    @NotBlank(message = "quyetDinh is required")
    private String quyetDinh;

    @Size(max = 500)
    private String reason;
}
