package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for TaiLieuDinhKem.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiLieuDinhKemResponse {

    private Long id;
    private String tenTaiLieu;
    private String duongDan;
    private Long kichThuoc;
    private LocalDate ngayTaiLen;
}
