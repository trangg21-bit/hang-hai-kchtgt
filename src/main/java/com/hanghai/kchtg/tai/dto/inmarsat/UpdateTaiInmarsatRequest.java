package com.hanghai.kchtg.tai.dto.inmarsat;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO cho việc cập nhật đài Inmarsat (F-090).
 * NOTE: code KHÔNG được phép sửa đổi. UUID-based identification.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaiInmarsatRequest {

    @Size(max = 200)
    private String name;

    @Size(max = 100)
    private String satelliteId;

    @DecimalMin("0")
    @DecimalMax("100")
    private BigDecimal signalStrength;

    @Size(max = 100)
    private String serviceType;

    private UUID id;
}
