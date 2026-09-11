package com.hanghai.kchtg.port.dto.berth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectRequest {
    @NotBlank
    private String cap;

    private String lyDo;
}
