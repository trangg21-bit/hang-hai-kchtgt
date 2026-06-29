package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.MucDoNghiemTrong;
import com.hanghai.kchtg.vanban.entity.TinhTrangXuLy;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a SuCo record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuCoCreateRequest {

    @NotBlank(message = "Vị trí không được để trống")
    private String viTri;

    private String moTa;
    private MucDoNghiemTrong mucDoNghiemTrong;
    private TinhTrangXuLy tinhTrangXuLy;
    private String nguoiBaoCao;
}
