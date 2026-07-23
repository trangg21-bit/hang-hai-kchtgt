package com.hanghai.kchtg.dikerevetment.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * Update request for DikeRevetment (F-044).
 */
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

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
    private java.util.UUID donViId;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}
