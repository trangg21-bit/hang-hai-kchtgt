package com.hanghai.kchtg.gis.layer.dto;

import com.hanghai.kchtg.gis.layer.entity.MapLayer.LayerType;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMapLayerRequest {

    @NotBlank(message = "Tên lớp bản đồ không được để trống")
    private String name;

    @NotBlank(message = "Mã lớp bản đồ không được để trống")
    private String code;

    @NotNull(message = "Loại lớp bản đồ không được để trống")
    private LayerType layerType;

    private String source;
    private Boolean visible;
    private Double opacity;
    private Integer order;
    private String styleConfig;
    private Status status;
}
