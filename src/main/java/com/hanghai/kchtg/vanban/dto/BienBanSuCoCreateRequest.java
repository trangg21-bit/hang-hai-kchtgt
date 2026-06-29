package com.hanghai.kchtg.vanban.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BienBanSuCoCreateRequest {

    @NotNull
    private Long suCoId;

    private String moTaChiTiet;

    private String bienPhapKacPhuc;

    private LocalDateTime thoiGianXuLyKetThuc;

    private String nguoiLapBienBan;

    private String taiLieuDinhKem;
}
