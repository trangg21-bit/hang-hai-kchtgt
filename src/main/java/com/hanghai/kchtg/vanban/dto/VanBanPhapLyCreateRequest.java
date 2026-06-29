package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.LoaiVanBan;
import com.hanghai.kchtg.vanban.entity.TinhTrangHieuLuc;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a VanBanPhapLy record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VanBanPhapLyCreateRequest {

    @NotBlank(message = "Tên văn bản không được để trống")
    private String tenVanBan;

    private String soHieu;
    private String coQuanBanHanh;
    private java.time.LocalDate ngayBanHanh;
    private java.time.LocalDate ngayCoHieuLuc;
    private java.time.LocalDate ngayHetHieuLuc;
    private LoaiVanBan loaiVanBan;
    private String linhVucApDung;
    private TinhTrangHieuLuc tinhTrangHieuLuc;
    private String nguoiTao;
}
