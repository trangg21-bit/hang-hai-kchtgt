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

    @NotBlank(message = "Ten doi tuong khong duoc de trong")
    private String name;

    @NotBlank(message = "Ma doi tuong khong duoc de trong")
    private String code;

    @NotNull(message = "Loai doi tuong khong duoc de trong")
    private ObjectType objectType;

    private Long categoryId;
    private Long iconId;

    @NotNull(message = "Kinh do khong duoc de trong")
    @DecimalMin(value = "-180.0", message = "Kinh do phai trong khoang -180~180")
    @DecimalMax(value = "180.0", message = "Kinh do phai trong khoang -180~180")
    private Double longitude;

    @NotNull(message = "Vĩ độ khong duoc de trong")
    @DecimalMin(value = "-90.0", message = "Vĩ độ phai trong khoang -90~90")
    @DecimalMax(value = "90.0", message = "Vĩ độ phai trong khoang -90~90")
    private Double latitude;

    private String description;

    @Builder.Default
    private Status status = Status.DRAFT;

    private Long unitId;
}
