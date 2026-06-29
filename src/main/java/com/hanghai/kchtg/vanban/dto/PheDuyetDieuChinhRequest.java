package com.hanghai.kchtg.vanban.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating/approving a PheDuyetDieuChinh record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetDieuChinhRequest {

    private String capPheDuyet;
    private String trangThai;
    private String nguoiPheDuyet;
    private LocalDate ngayPheDuyet;
    private String ghiChu;
}
