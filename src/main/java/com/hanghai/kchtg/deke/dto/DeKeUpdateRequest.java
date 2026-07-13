package com.hanghai.kchtg.deke.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * Update request for DeKe (F-044).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeKeUpdateRequest {

    private com.hanghai.kchtg.deke.entity.LoaiDe loaiDe;
    private String viTri;
    private Double chieuDai;
    private Double chieuRong;
    private Double chieuCao;
    private String matVatLieu;
    private String tinhTrang;
    private String ghiChu;
}
