package com.hanghai.kchtg.luonghanghai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetRequest {

    @NotBlank(message = "Hanh dong la bat buoc (APPROVE/REJECT)")
    private String action;

    @NotBlank(message = "Nguoi phe duyet la bat buoc")
    private String approvedBy;

    private String lyDo;
}
