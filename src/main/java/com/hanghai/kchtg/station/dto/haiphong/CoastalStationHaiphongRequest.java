package com.hanghai.kchtg.station.dto.haiphong;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationHaiphongRequest {

    private UUID orgUnitId;
    private UUID operatingOrgId;
    private Integer provinceId;

    private String code;
    private String name;

    private String locationAddress;
    private String conditionStatus;

    // --- Đặc thù TTXLTT Hà Nội / Hải Phòng ---
    private String portName;
    private String district;
    private String ward;
    private String operationalLicense;
    private String licenseExpiry;
    private String inspectorName;
    private String inspectorPhone;
    private String lastInspectionDate;
    private String nextInspectionDate;
    private String coverageArea;
    private String equipmentType;
    private String communicationFrequency;
    private String servicesProvided;
    private String description;
    private String contactPerson;
    private String contactPhone;

    // --- GIS ---
    private UUID spatialId;
    private UUID symbolId;
    private String symbol;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coordinates;

    public void setSymbolId(Object sym) {
        if (sym == null) {
            this.symbolId = null;
        } else if (sym instanceof UUID u) {
            this.symbolId = u;
        } else {
            String s = sym.toString().trim();
            if (s.isEmpty()) {
                this.symbolId = null;
            } else {
                try {
                    this.symbolId = UUID.fromString(s);
                } catch (IllegalArgumentException e) {
                    this.symbol = s;
                }
            }
        }
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
        if (symbol != null && !symbol.isBlank() && this.symbolId == null) {
            try {
                this.symbolId = UUID.fromString(symbol.trim());
            } catch (IllegalArgumentException ignored) {}
        }
    }

    // Getter tương thích ngược nếu payload cũ gửi stationCode / stationName
    public void setStationCode(String stationCode) {
        if (this.code == null || this.code.isBlank()) {
            this.code = stationCode;
        }
    }

    public void setStationName(String stationName) {
        if (this.name == null || this.name.isBlank()) {
            this.name = stationName;
        }
    }

    public String getStationCode() {
        return this.code;
    }

    public String getStationName() {
        return this.name;
    }
}
