package com.hanghai.kchtg.nhatram.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.nhatram.dto.history.NhaTramHistoryResponse;
import com.hanghai.kchtg.nhatram.entity.NhaTramHistoryActionType;
import com.hanghai.kchtg.nhatram.entity.NhaTramType;
import com.hanghai.kchtg.nhatram.service.NhaTramHistoryService;
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
@RequestMapping("/api/v1/nhatram/history")
@RequiredArgsConstructor
public class NhaTramHistoryController {

    private final NhaTramHistoryService historyService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NhaTramHistoryResponse>>> getHistory(
            @RequestParam NhaTramType type,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) NhaTramHistoryActionType actionType,
            @RequestParam(required = false) Long changedBy,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("changedAt").descending());
        Page<NhaTramHistoryResponse> result = historyService.getHistoryFiltered(
                type, entityId, actionType, changedBy, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
