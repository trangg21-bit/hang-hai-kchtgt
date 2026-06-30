package com.hanghai.kchtg.tramradar.controller;

import com.hanghai.kchtg.tramradar.dto.*;
import com.hanghai.kchtg.tramradar.service.TramRadarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tram-radar")
@RequiredArgsConstructor
@Slf4j
public class TramRadarController {

    private final TramRadarService service;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TramRadarCreateRequest request, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.create(request, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating TramRadar: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi tạo trạm radar: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            TramRadarResponse response = service.getById(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting TramRadar by id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Không tìm thấy trạm radar: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<TramRadarResponse> responses = service.findAll(page, size);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error finding all TramRadar: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi lấy danh sách: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody TramRadarUpdateRequest request,
                                    Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.update(id, request, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi cập nhật trạm radar: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            service.delete(id, username);
            return ResponseEntity.ok("Đã xóa trạm radar thành công");
        } catch (Exception e) {
            log.error("Error deleting TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi xóa trạm radar: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<?> approveC1(@PathVariable Long id,
                                       @RequestBody PheDuyetRequest request,
                                       Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.approveC1(id, request, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error approving C1 for TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi phê duyệt cấp 1: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<?> approveC2(@PathVariable Long id,
                                       @RequestBody PheDuyetRequest request,
                                       Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.approveC2(id, request, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error approving C2 for TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi phê duyệt cấp 2: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable Long id) {
        try {
            List<HistoryEntry> history = service.getHistory(id);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error getting history for TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi lấy lịch sử phê duyệt: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tinhTrang,
            @RequestParam(required = false) String trangThai) {
        try {
            List<TramRadarResponse> responses = service.search(keyword, tinhTrang, trangThai);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error searching TramRadar: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi tìm kiếm: " + e.getMessage());
        }
    }
}
