package com.hanghai.kchtg.shiprepairfacility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacilityAttachmentResponse {

    private UUID id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String documentType;
    private String uploadedBy;
    private LocalDateTime uploadedDate;
}
