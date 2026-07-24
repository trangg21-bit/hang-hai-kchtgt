package com.hanghai.kchtg.radarstation.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalResponse {
    private String user;
    private LocalDateTime time;
    private String decision;
    private String reason;
}
