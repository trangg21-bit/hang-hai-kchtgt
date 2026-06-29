package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.TinhTrangDieuChinh;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for DieuChinhQuyHoach.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DieuChinhQuyHoachResponse {

    private Long id;
    private Long quyHoachId;
    private String loaiDieuChinh;
    private String lyDo;
    private String moTaChiTiet;
    private String phamViAnhHuong;
    private TinhTrangDieuChinh tinhTrang;
    private String nguoiDangKy;
    private LocalDateTime ngayDangKy;
    private LocalDateTime ngaySuaDoi;
    private List<PheDuyetDieuChinhResponse> pheDuyetDieuChinh;
}
