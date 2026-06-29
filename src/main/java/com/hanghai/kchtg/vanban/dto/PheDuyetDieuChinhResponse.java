package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for PheDuyetDieuChinh.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetDieuChinhResponse {

    private Long id;
    private Long dieuChinhId;
    private String capPheDuyet;
    private String trangThai;
    private String nguoiPheDuyet;
    private LocalDate ngayPheDuyet;
    private String ghiChu;
}
