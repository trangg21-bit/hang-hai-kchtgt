package com.hanghai.kchtg.beacon.controller;

import com.hanghai.kchtg.beacon.dto.history.BeaconHistoryResponse;
import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import com.hanghai.kchtg.beacon.service.BeaconHistoryService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * REST Controller for shared BeaconHistory endpoints (F-073 / F-079).
 */
@RestController
@RequestMapping("/api/beacon-history")
@RequiredArgsConstructor
public class BeaconHistoryController {

    private final BeaconHistoryService historyService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BeaconHistoryResponse>>> getHistory(
            @RequestParam BeaconType type,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) String entityCode,
            @RequestParam(required = false) BeaconHistoryActionType actionType,
            @RequestParam(required = false) Long changedBy,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        java.util.UUID uuid = null;
        if (entityId != null && !entityId.trim().isEmpty()) {
            try {
                uuid = java.util.UUID.fromString(entityId.trim());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.ok(ApiResponse.success(org.springframework.data.domain.Page.empty()));
            }
        }
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("changedAt").descending());
        Page<BeaconHistoryResponse> result = historyService.getHistoryFiltered(
                type, uuid, entityCode, actionType, changedBy, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
