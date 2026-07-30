package com.hanghai.kchtg.port.dto.port;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for a single port infrastructure item (composite form).
 */
@Data
public class InfrastructureDto {

    private Integer sequenceNumber;

    @NotBlank(message = "Tên cơ sở hạ tầng không được để trống")
    private String infrastructureName;

    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;
}
