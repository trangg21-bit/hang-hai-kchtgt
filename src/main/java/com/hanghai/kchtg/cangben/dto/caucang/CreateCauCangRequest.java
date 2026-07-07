package com.hanghai.kchtg.cangben.dto.caucang;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateCauCangRequest {

    @NotBlank(message = "Mã cầu không được để trống")
    @Size(max = 50)
    private String maCau;

    @NotBlank(message = "Tên cầu không được để trống")
    @Size(max = 255)
    private String tenCau;

    @NotNull(message = "Bến cảng chủ không được để trống")
    private UUID benCangId;

    private BigDecimal chieuDai;
    private BigDecimal taiTrong;
    private String loaiCau;
    private String trangThaiHoatDong;
}
