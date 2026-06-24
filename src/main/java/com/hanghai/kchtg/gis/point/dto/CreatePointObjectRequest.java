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
public class CreatePointObjectRequest {

    @NotBlank(message = "Tên đối tượng không được để trống")
    private String name;

    @NotBlank(message = "Mã đối tượng không được để trống")
    private String code;

    @NotNull(message = "Loại đối tượng không được để trống")
    private ObjectType objectType;

    private Long categoryId;
    private Long iconId;

    @NotNull(message = "Kinh độ không được để trống")
    @DecimalMin(value = "-180.0", message = "Kinh độ phải trong khoảng -180~180")
    @DecimalMax(value = "180.0", message = "Kinh độ phải trong khoảng -180~180")
    private Double longitude;

    @NotNull(message = "Vĩ độ không được để trống")
    @DecimalMin(value = "-90.0", message = "Vĩ độ phải trong khoảng -90~90")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải trong khoảng -90~90")
    private Double latitude;

    private String description;

    @Builder.Default
    private Status status = Status.DRAFT;

    private Long unitId;
}