package com.hanghai.kchtg.gis.layer.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMapViewRequest {

    @NotBlank(message = "Ten map view khong duoc de trong")
    @Size(max = 100)
    private String name;

    @NotNull(message = "userId khong duoc de trong")
    private Long userId;

    @NotNull(message = "centerLon khong duoc de trong")
    private Double centerLon;

    @NotNull(message = "centerLat khong duoc de trong")
    private Double centerLat;

    @NotNull(message = "zoom khong duoc de trong")
    private Integer zoom;

    private String visibleLayers;

    private String layerOrder;

    private String styleConfigs;
}
