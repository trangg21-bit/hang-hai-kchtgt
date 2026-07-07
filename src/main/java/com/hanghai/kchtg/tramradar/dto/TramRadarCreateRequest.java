package com.hanghai.kchtg.tramradar.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TramRadarCreateRequest {
    @NotBlank(message = "Tên trạm không được để trống")
    private String tenTram;

    @NotBlank(message = "Vị trí không được để trống")
    private String viTri;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal kinhDo;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal viDo;

    private String loaiTram;
    private String coTrinh;

    @Positive(message = "Diện tích phải là số dương")
    private BigDecimal dienTichPhaXa;

    private String nguonGoc;
    private String tinhTrang;
}
