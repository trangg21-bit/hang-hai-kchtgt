package com.hanghai.kchtg.luonghanghai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Approval request for LuongHangHai (F-039, F-040).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetRequest {

    private Integer capPheDuyet;

    @NotBlank(message = "Nguoi phe duyet khong duoc de trong")
    private String nguoiPheDuyet;

    @NotBlank(message = "Trang thai khong duoc de trong")
    private String trangThai;

    private String lyDo;
}
