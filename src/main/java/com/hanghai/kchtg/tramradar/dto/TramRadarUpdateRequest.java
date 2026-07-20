package com.hanghai.kchtg.tramradar.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TramRadarUpdateRequest {
    private String tenTram;
    private String viTri;
    private BigDecimal kinhDo;
    private BigDecimal viDo;
    private String loaiTram;
    private String coTrinh;
    private BigDecimal dienTichPhaXa;
    private String nguonGoc;
    private String tinhTrang;
    private java.util.UUID orgUnitId;
    private BigDecimal chieuCaoThapRadar;
    private BigDecimal tamHieuLucRadar;
    private java.util.UUID heThongVtsId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}