package com.hanghai.kchtg.vanban.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Search request DTO for port planning query (F-133).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TraCuuRequest {

    private String keyword;
    private String status;
    private LocalDate yearStart;
    private LocalDate yearEnd;

    @Min(value = 0, message = "Trang phải >= 0")
    private int page = 0;

    @Min(value = 1, message = "Kích thước trang phải >= 1")
    @Max(value = 100, message = "Kích thước trang tối đa 100")
    private int size = 20;
}
