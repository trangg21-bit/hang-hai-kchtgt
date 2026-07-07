package com.hanghai.kchtg.cangben.dto.bencang;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateBenCangRequest {

    @NotBlank(message = "Mã bến không được để trống")
    @Size(max = 50)
    private String maBen;

    @NotBlank(message = "Tên bến không được để trống")
    @Size(max = 255)
    private String tenBen;

    @NotNull(message = "Cảng biển chủ không được để trống")
    private UUID cangBienId;

    private String tuyenDuongThuy;
    private BigDecimal viDo;
    private BigDecimal kinhDo;
    private BigDecimal chieuDai;
    private BigDecimal chieuRong;
    private String loaiBen;
    private BigDecimal doSauLuong;
    private String trangThaiHoatDong;
}
