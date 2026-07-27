package com.hanghai.kchtg.station.controller;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.station.dto.history.StationHistoryResponse;
import com.hanghai.kchtg.station.service.StationHistoryService;
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
 * REST Controller cho du lich su nha tram (F-084 / F-090).
 */
@RestController
@RequestMapping("/api/v1/station-history")
@RequiredArgsConstructor
public class StationHistoryController {

    private final StationHistoryService historyService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StationHistoryResponse>>> getHistory(
            @RequestParam String type,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) Long changedBy,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("changedAt").descending());
        Page<StationHistoryResponse> result = historyService.getHistoryFiltered(
                type, entityId, actionType, changedBy, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
