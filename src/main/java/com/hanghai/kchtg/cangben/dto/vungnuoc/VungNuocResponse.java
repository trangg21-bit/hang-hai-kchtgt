package com.hanghai.kchtg.cangben.dto.vungnuoc;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class VungNuocResponse {
    private UUID id;
    private String maVungNuoc;
    private String tenVungNuoc;
    private UUID cangBienId;
    private BigDecimal dienTich;
    private BigDecimal doSauMax;
    private BigDecimal doSauTrungBinh;
    private String loaiVungNuoc;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong trangThaiHoatDong;
    private com.hanghai.kchtg.common.entity.TrangThaiPheDuyet trangThaiPheDuyet;
    private UUID orgUnitId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID bieuTuongId;
}
