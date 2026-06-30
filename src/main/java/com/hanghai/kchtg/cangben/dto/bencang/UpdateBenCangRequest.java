package com.hanghai.kchtg.cangben.dto.bencang;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdateBenCangRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String tenBen;
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
