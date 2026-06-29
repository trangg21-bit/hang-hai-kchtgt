package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.TinhTrangQuyHoach;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating a QuyHoachBenCang record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuyHoachBenCangCreateRequest {

    @NotBlank(message = "Tên đồ án không được để trống")
    private String tenDoAn;

    private String coQuanPheDuyet;
    private LocalDate ngayPheDuyet;
    private String phamViApDung;
    private String tiLeBanDo;
    private TinhTrangQuyHoach tinhTrang;
    private String duongDanFile;
    private String nguoiTao;
}
