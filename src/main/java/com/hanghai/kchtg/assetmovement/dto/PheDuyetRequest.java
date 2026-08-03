package com.hanghai.kchtg.assetmovement.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetRequest {
    @Size(max = 2000)
    private String remarks;
}
