package com.hanghai.kchtg.cosuachua.controller;

import com.hanghai.kchtg.cosuachua.dto.*;
import com.hanghai.kchtg.cosuachua.service.CoSuaChuaDongTauService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/co-so-sua-chua")
@RequiredArgsConstructor
@Slf4j
public class CoSuaChuaDongTauController {

    private final CoSuaChuaDongTauService service;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CoSuaChuaDongTauCreateRequest request, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            CoSuaChuaDongTauResponse response = service.create(request, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating CoSuaChuaDongTau: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi tạo cơ sở sửa chữa, đóng tàu: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            CoSuaChuaDongTauResponse response = service.getById(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting CoSuaChuaDongTau by id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Không tìm thấy cơ sở sửa chữa, đóng tàu: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<CoSuaChuaDongTauResponse> responses = service.findAll(page, size);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error finding all CoSuaChuaDongTau: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi lấy danh sách: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody CoSuaChuaDongTauUpdateRequest request,
                                    Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            CoSuaChuaDongTauResponse response = service.update(id, request, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating CoSuaChuaDongTau id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi cập nhật cơ sở sửa chữa, đóng tàu: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            service.delete(id, username);
            return ResponseEntity.ok("Đã xóa cơ sở sửa chữa, đóng tàu thành công");
        } catch (Exception e) {
            log.error("Error deleting CoSuaChuaDongTau id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi xóa cơ sở sửa chữa, đóng tàu: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<?> approveC1(@PathVariable Long id,
                                       @RequestBody PheDuyetRequest request,
                                       Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            CoSuaChuaDongTauResponse response = service.approveC1(id, request, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error approving C1 for CoSuaChuaDongTau id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi phê duyệt cấp 1: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<?> approveC2(@PathVariable Long id,
                                       @RequestBody PheDuyetRequest request,
                                       Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            CoSuaChuaDongTauResponse response = service.approveC2(id, request, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error approving C2 for CoSuaChuaDongTau id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi phê duyệt cấp 2: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable Long id) {
        try {
            List<HistoryEntry> history = service.getHistory(id);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error getting history for CoSuaChuaDongTau id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi lấy lịch sử phê duyệt: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tinhThanh,
            @RequestParam(required = false) String trangThai) {
        try {
            List<CoSuaChuaDongTauResponse> responses = service.search(keyword, tinhThanh, trangThai);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error searching CoSuaChuaDongTau: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi khi tìm kiếm: " + e.getMessage());
        }
    }
}
