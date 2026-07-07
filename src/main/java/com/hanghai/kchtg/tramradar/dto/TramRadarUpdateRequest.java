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
}
