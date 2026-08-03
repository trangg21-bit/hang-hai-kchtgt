package com.hanghai.kchtg.port.dto.berth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApproveRequest {
    @NotBlank
    private String cap;
}
