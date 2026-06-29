package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.TinhTrangQuyHoach;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for QuyHoachBenCang.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuyHoachBenCangResponse {

    private Long id;
    private String tenDoAn;
    private String coQuanPheDuyet;
    private LocalDate ngayPheDuyet;
    private String phamViApDung;
    private String tiLeBanDo;
    private TinhTrangQuyHoach tinhTrang;
    private String duongDanFile;
    private String nguoiTao;
    private LocalDateTime ngayTao;
    private String nguoiSuaDoi;
    private LocalDateTime ngaySuaDoi;
    private List<HamMucQuyHoachResponse> hamMucQuyHoach;
}
