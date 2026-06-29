package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.LoaiVanBan;
import com.hanghai.kchtg.vanban.entity.TinhTrangHieuLuc;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for VanBanPhapLy.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VanBanPhapLyResponse {

    private Long id;
    private String tenVanBan;
    private String soHieu;
    private String coQuanBanHanh;
    private LocalDate ngayBanHanh;
    private LocalDate ngayCoHieuLuc;
    private LocalDate ngayHetHieuLuc;
    private LoaiVanBan loaiVanBan;
    private String linhVucApDung;
    private TinhTrangHieuLuc tinhTrangHieuLuc;
    private String nguoiTao;
    private LocalDateTime ngayTao;
    private String nguoiSuaDoi;
    private LocalDateTime ngaySuaDoi;
    private List<TaiLieuDinhKemResponse> taiLieuDinhKem;
}
