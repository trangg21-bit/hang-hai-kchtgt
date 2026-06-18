package com.hanghai.kchtg.gis.layer.dto;

import com.hanghai.kchtg.gis.layer.entity.MapLayer.LayerType;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.Status;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMapLayerRequest {

    @NotBlank(message = "Ten layer khong duoc de trong")
    private String name;

    @NotBlank(message = "Ma layer khong duoc de trong")
    private String code;

    @NotNull(message = "Layer type khong duoc de trong")
    private LayerType layerType;

    private String source;
    private Boolean visible;
    private Double opacity;
    private Integer order;
    private String styleConfig;
    private Status status;
}
