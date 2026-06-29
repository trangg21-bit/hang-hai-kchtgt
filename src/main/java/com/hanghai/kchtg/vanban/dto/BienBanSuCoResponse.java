package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BienBanSuCoResponse {

    private Long id;
    private Long suCoId;
    private String moTaChiTiet;
    private String bienPhapKacPhuc;
    private LocalDateTime thoiGianXuLyKetThuc;
    private String nguoiLapBienBan;
    private LocalDateTime ngayLap;
    private String taiLieuDinhKem;
}
