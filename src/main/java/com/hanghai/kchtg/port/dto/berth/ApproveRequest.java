package com.hanghai.kchtg.port.dto.berth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApproveRequest {
    @NotBlank
    private String cap;

    @Size(max = 1000)
    private String content;
}
