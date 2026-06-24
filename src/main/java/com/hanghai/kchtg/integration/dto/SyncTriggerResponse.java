package com.hanghai.kchtg.integration.dto;

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
public class SyncTriggerResponse {
    private UUID syncId;
    private String status;
    private String message;
    private LocalDateTime timestamp;
}