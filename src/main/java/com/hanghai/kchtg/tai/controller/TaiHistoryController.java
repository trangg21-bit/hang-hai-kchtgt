package com.hanghai.kchtg.tai.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tai.dto.history.TaiHistoryResponse;
import com.hanghai.kchtg.tai.entity.TaiHistoryActionType;
import com.hanghai.kchtg.tai.entity.TaiType;
import com.hanghai.kchtg.tai.service.TaiHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller cho du lich tai station (M-015).
 * Pattern tu NhaTramHistoryController (M-014).
 */
@RestController
@RequestMapping("/api/v1/tai/history")
@RequiredArgsConstructor
public class TaiHistoryController {

    private final TaiHistoryService historyService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'tai:history')")
    public ResponseEntity<ApiResponse<Page<TaiHistoryResponse>>> findAll(
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) TaiType taiType,
            @RequestParam(required = false) TaiHistoryActionType actionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("changedAt").descending());
        Page<TaiHistoryResponse> result;
        if (entityId != null && taiType != null) {
            result = historyService.getHistory(entityId, taiType, pageable);
        } else if (actionType != null && taiType != null) {
            result = historyService.findHistoryByAction(actionType, pageable);
        } else if (taiType != null) {
            result = historyService.findHistoryByType(taiType, pageable);
        } else {
            result = historyService.findAllHistory(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("@auth.check(authentication, 'tai:history')")
    public ResponseEntity<ApiResponse<Page<TaiHistoryResponse>>> findByType(
            @PathVariable TaiType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("changedAt").descending());
        Page<TaiHistoryResponse> result = historyService.findHistoryByType(type, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/action/{action}")
    @PreAuthorize("@auth.check(authentication, 'tai:history')")
    public ResponseEntity<ApiResponse<Page<TaiHistoryResponse>>> findByAction(
            @PathVariable TaiHistoryActionType action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("changedAt").descending());
        Page<TaiHistoryResponse> result = historyService.findHistoryByAction(action, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
