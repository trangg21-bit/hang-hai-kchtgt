package com.hanghai.kchtg.dikerevetment.dto;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String dikeRevetmentName;
    private Double length;
    private Double crestElevation;
    private LocalDate commissioningDate;
    private Double height;
    private String surfaceMaterial;
    private String status;
    private String note;
    private UUID orgUnitId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;
}
