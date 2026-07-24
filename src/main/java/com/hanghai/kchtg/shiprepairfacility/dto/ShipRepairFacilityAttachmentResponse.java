package com.hanghai.kchtg.shiprepairfacility.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacilityAttachmentResponse {

    private Long id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String documentType;
    private String uploadedBy;
    private LocalDateTime uploadedDate;
}
