package com.hanghai.kchtg.tramradar.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PheDuyetResponse {
    private String user;
    private LocalDateTime time;
    private String decision;
    private String reason;
}
