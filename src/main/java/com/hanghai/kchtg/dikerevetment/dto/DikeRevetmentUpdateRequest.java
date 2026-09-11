package com.hanghai.kchtg.dikerevetment.dto;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.Digits;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Update request for DikeRevetment (F-044).
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DikeRevetmentUpdateRequest {

    private DikeRevetmentType dikeRevetmentType;
    private String location;
    private String locationDetail;
    private String dikeRevetmentName;
    @Digits(integer = 16, fraction = 4, message = "Chiều dài không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal length;
    @Digits(integer = 16, fraction = 4, message = "Cao trình đỉnh không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal crestElevation;
    private LocalDate commissioningDate;
    @Digits(integer = 16, fraction = 4, message = "Chiều cao không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal height;
    private String surfaceMaterial;
    private String status;
    private String note;
    private UUID orgUnitId;
    private UUID seaportId;
    private UUID operatingUnitId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;
}
