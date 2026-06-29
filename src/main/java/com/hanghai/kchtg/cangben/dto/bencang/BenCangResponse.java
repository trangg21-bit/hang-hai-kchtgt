package com.hanghai.kchtg.cangben.dto.bencang;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BenCangResponse {
    private UUID id;
    private String maBen;
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
    private String trangThaiPheDuyet;
    private UUID orgUnitId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
