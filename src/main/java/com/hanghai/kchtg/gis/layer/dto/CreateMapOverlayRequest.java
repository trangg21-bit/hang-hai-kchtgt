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
public class CreateMapOverlayRequest {

    @NotBlank(message = "Tên overlay không được để trống")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "URL không được để trống")
    private String url;

    @NotBlank(message = "Tên lớp không được để trống")
    @Size(max = 100)
    private String layerName;

    private String format;
    private Boolean visible;
    private Double opacity;
    private Integer zIndex;
}