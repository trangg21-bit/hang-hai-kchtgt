package com.hanghai.kchtg.radarstation.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarStationAttachmentResponse {
    private Long id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String documentType;
    private String uploadedBy;
    private LocalDateTime uploadedDate;
}
