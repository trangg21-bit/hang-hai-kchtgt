package com.hanghai.kchtg.port.dto.port;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

/**
 * DTO for a single infrastructure item (công trình KCHT) belonging to a port.
 */
@Data
public class PortInfrastructureDto {

    private UUID id;

    @NotNull(message = "Số thứ tự không được để trống")
    private Integer stt;

    @NotBlank(message = "Tên công trình không được để trống")
    @Size(max = 255, message = "Tên công trình tối đa 255 ký tự")
    private String infraName;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;
}
