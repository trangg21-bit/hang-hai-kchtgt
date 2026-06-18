package com.hanghai.kchtg.gis.point.dto;

import com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
import com.hanghai.kchtg.gis.point.entity.PointObject.ApprovalStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePointObjectRequest {

    private String name;
    private String code;
    private ObjectType objectType;
    private Long categoryId;
    private Long iconId;

    @DecimalMin(value = "-180.0", message = "Kinh do phai trong khoang -180~180")
    @DecimalMax(value = "180.0", message = "Kinh do phai trong khoang -180~180")
    private Double longitude;

    @DecimalMin(value = "-90.0", message = "Vĩ độ phai trong khoang -90~90")
    @DecimalMax(value = "90.0", message = "Vĩ độ phai trong khoang -90~90")
    private Double latitude;

    private String description;
    private Status status;
    private Long unitId;
}
