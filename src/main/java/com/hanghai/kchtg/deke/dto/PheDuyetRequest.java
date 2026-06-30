package com.hanghai.kchtg.deke.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Approval request for DeKe (F-045, F-046).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetRequest {

    private Integer capPheDuyet;

    @NotBlank(message = "Nguoi phe duyet khong duoc de trong")
    private String nguoiPheDuyet;

    @NotBlank(message = "Quyet dinh khong duoc de trong")
    private String quyetDinh;

    private String lyDo;
}
