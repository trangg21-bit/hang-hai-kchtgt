package com.hanghai.kchtg.station.dto.haiphong;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationHaiphongResponse {

    private UUID id;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID operatingOrgId;
    private String operatingOrgName;
    private Integer provinceId;
    private String provinceName;

    private String code;
    private String name;

    private String locationAddress;
    private String conditionStatus;

    private String servicesProvided;
    private String description;

    // --- GIS ---
    private UUID spatialId;
    private UUID symbolId;
    private String symbol;
    private String symbolName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coordinates;

    // --- Phê duyệt & Kiểm toán ---
    private ApprovalStatus approvalStatus;
    private ApprovalLevel approvalLevel;
    private LocalDateTime submittedAt;
    private UUID submittedBy;
    private String submittedByName;

    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;
    private String level1ApprovalContent;
    private String approvalContentLevel1;

    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;
    private String level2ApprovalContent;
    private String approvalContentLevel2;

    private String rejectionReason;

    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;

    private UUID updatedBy;
    private String updatedByName;
    private LocalDateTime updatedAt;

    // Getter tương thích ngược cho client/legacy code
    public String getStationCode() {
        return this.code;
    }

    public void setStationCode(String stationCode) {
        this.code = stationCode;
    }

    public String getStationName() {
        return this.name;
    }

    public void setStationName(String stationName) {
        this.name = stationName;
    }

    public String getSymbol() {
        return this.symbolId != null ? this.symbolId.toString() : this.symbol;
    }
}
