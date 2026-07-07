package com.hanghai.kchtg.cosuachua.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetRequest {

    @NotBlank(message = "quyetDinh is required")
    private String quyetDinh;

    @Size(max = 500)
    private String lyDo;
}
