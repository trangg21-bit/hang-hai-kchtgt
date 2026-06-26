package com.hanghai.kchtg.gis.layer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMapViewRequest {

    @NotBlank(message = "Tên map view không được để trống")
    @Size(max = 100)
    private String name;

    @NotNull(message = "ID người dùng không được để trống")
    private Long userId;

    @NotNull(message = "Kinh độ trung tâm không được để trống")
    private Double centerLon;

    @NotNull(message = "Vĩ độ trung tâm không được để trống")
    private Double centerLat;

    @NotNull(message = "Tỷ lệ thu phóng không được để trống")
    private Integer zoom;

    private String visibleLayers;

    private String layerOrder;

    private String styleConfigs;
}
