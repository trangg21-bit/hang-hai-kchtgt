package com.hanghai.kchtg.mapicon.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.mapicon.dto.CreateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.dto.MapSymbolResponse;
import com.hanghai.kchtg.mapicon.dto.UpdateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import com.hanghai.kchtg.mapicon.service.MapSymbolService;
import com.hanghai.kchtg.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/symbols")
@RequiredArgsConstructor
public class MapSymbolController {

    private final MapSymbolService service;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<MapSymbolResponse>>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        MapSymbolStatus symbolStatus = (status != null && !status.trim().isEmpty())
                ? MapSymbolStatus.fromString(status)
                : null;
        return ResponseEntity.ok(ApiResponse.success(service.search(search, symbolStatus, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MapSymbolResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MapSymbolResponse>> create(
            @Valid @RequestBody CreateMapSymbolRequest request,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
        MapSymbolResponse response = service.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ký hiệu bản đồ đã được tạo thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MapSymbolResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMapSymbolRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Ký hiệu bản đồ đã được cập nhật thành công", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Ký hiệu bản đồ đã được xóa thành công", null));
    }
}
