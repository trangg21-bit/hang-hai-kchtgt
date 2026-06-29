package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.MucDoNghiemTrong;
import com.hanghai.kchtg.vanban.entity.TinhTrangXuLy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for SuCo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuCoResponse {

    private Long id;
    private LocalDateTime thoiGianPhatHien;
    private String viTri;
    private MucDoNghiemTrong mucDoNghiemTrong;
    private String moTa;
    private TinhTrangXuLy tinhTrangXuLy;
    private String nguoiBaoCao;
    private LocalDateTime ngayTao;
    private String nguoiSuaDoi;
    private LocalDateTime ngaySuaDoi;
    private List<TienDoXuLyResponse> tienDoXuLy;
}
