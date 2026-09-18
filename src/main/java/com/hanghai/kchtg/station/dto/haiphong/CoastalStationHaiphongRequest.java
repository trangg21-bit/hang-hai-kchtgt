package com.hanghai.kchtg.station.dto.haiphong;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    @NotNull(message = "Địa điểm (Tỉnh/TP) là bắt buộc")
    private Integer provinceId;

    private String code;
    private String name;

    @NotBlank(message = "Địa điểm chi tiết là bắt buộc")
    private String locationAddress;
    private String conditionStatus;

    private String servicesProvided;
    private String description;

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
