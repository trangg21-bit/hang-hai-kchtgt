package com.hanghai.kchtg.cangben.dto.cangcan;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CangCanResponse {
    private UUID id;
    private String maCangCan;
    private String tenCangCan;
    private String tinhThanhPho;
    private BigDecimal viDo;
    private BigDecimal kinhDo;
    private BigDecimal dienTich;
    private BigDecimal congSuatTEU;
    private String trangThaiHoatDong;
    private String trangThaiPheDuyet;
    private UUID orgUnitId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
