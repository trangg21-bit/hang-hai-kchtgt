package com.hanghai.kchtg.cangben.dto.vungnuoc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateVungNuocRequest {

    @NotBlank(message = "Mã vùng nước không được để trống")
    @Size(max = 50)
    private String maVungNuoc;

    @NotBlank(message = "Tên vùng nước không được để trống")
    @Size(max = 255)
    private String tenVungNuoc;

    @NotNull(message = "Cảng biển chủ không được để trống")
    private UUID cangBienId;

    private BigDecimal dienTich;
    private BigDecimal doSauMax;
    private BigDecimal doSauTrungBinh;
    private String loaiVungNuoc;
    private String trangThaiHoatDong;
}
