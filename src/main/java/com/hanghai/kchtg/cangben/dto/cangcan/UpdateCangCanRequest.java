package com.hanghai.kchtg.cangben.dto.cangcan;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdateCangCanRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String tenCangCan;
    private String tinhThanhPho;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal viDo;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal kinhDo;

    @DecimalMin(value = "0", inclusive = false, message = "Diện tích phải lớn hơn 0")
    private BigDecimal dienTich;

    private BigDecimal congSuatTEU;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong trangThaiHoatDong;
    private java.util.UUID bieuTuongId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;


}
