package com.hanghai.kchtg.cangben.dto.caucang;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CauCangResponse {
    private UUID id;
    private String maCau;
    private String tenCau;
    private UUID benCangId;
    private BigDecimal chieuDai;
    private BigDecimal taiTrong;
    private String loaiCau;
    private String trangThaiHoatDong;
    private String trangThaiPheDuyet;
    private UUID orgUnitId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
