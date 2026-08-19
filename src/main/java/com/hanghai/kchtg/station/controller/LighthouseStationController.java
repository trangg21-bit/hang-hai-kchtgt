package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.station.dto.lighthouse.CreateLighthouseStationRequest;
import com.hanghai.kchtg.station.dto.lighthouse.LighthouseStationResponse;
import com.hanghai.kchtg.station.dto.lighthouse.UpdateLighthouseStationRequest;
import com.hanghai.kchtg.station.service.LighthouseStationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.hanghai.kchtg.security.annotation.DataScope;

/**
 * REST Controller cho CRUD + duyet nha tram den (F-086 den F-091).
 */
@RestController
@RequestMapping("/api/v1/lighthouse-station")
@RequiredArgsConstructor
@DataScope
public class LighthouseStationController {

        private final LighthouseStationService service;

        @GetMapping
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:read') or @auth.check(authentication, 'data:read')")
        public ResponseEntity<ApiResponse<List<LighthouseStationResponse>>> findAll() {
                return ResponseEntity.ok(ApiResponse.success(service.findAll()));
        }

        @GetMapping("/{id}")
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:read') or @auth.check(authentication, 'data:read')")
        public ResponseEntity<ApiResponse<LighthouseStationResponse>> findById(
                        @PathVariable UUID id) {
                return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
        }

        @GetMapping("/search")
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:read') or @auth.check(authentication, 'data:read')")
        public ResponseEntity<ApiResponse<List<LighthouseStationResponse>>> search(
                        @RequestParam(required = false) String name,
                        @RequestParam(required = false) String code,
                        @RequestParam(required = false) String type,
                        @RequestParam(required = false) String status) {
                return ResponseEntity.ok(ApiResponse.success(
                                service.search(name, code, type, status)));
        }

        @PostMapping
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:create') or @auth.check(authentication, 'data:create')")
        public ResponseEntity<ApiResponse<LighthouseStationResponse>> create(
                        @Valid @RequestBody CreateLighthouseStationRequest request) {
                LighthouseStationResponse response = service.create(request);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Tao nhà trạm đèn thành công", response));
        }

        @PutMapping("/{id}")
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:update') or @auth.check(authentication, 'data:update')")
        public ResponseEntity<ApiResponse<LighthouseStationResponse>> update(
                        @PathVariable UUID id,
                        @Valid @RequestBody UpdateLighthouseStationRequest request) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Cap nhat nhà trạm đèn thành công",
                                service.update(id, request)));
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:delete') or @auth.check(authentication, 'data:delete')")
        public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
                service.delete(id);
                return ResponseEntity.ok(
                                ApiResponse.success("Da xoa nhà trạm đèn thành công", null));
        }

        @PostMapping("/{id}/submit-approval")
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:create') or @auth.check(authentication, 'lighthousestation:update') or @auth.check(authentication, 'data:create') or @auth.check(authentication, 'data:update')")
        public ResponseEntity<ApiResponse<Void>> submitForApproval(
                        @PathVariable UUID id) {
                service.submitForApproval(id);
                return ResponseEntity.ok(
                                ApiResponse.success("Da gửi phê duyệt", null));
        }

        @PostMapping("/{id}/approve-l1")
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:approvec1') or @auth.check(authentication, 'lighthousestation:approvel1') or @auth.check(authentication, 'data:approvec1') or @auth.check(authentication, 'data:approvel1')")
        public ResponseEntity<ApiResponse<LighthouseStationResponse>> approveL1(
                        @PathVariable UUID id, @RequestParam UUID approverId) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Phê duyệt L1 thành công",
                                service.approveL1(id, approverId)));
        }

        @PostMapping("/{id}/approve-l2")
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:approvec2') or @auth.check(authentication, 'lighthousestation:approvel2') or @auth.check(authentication, 'data:approvec2') or @auth.check(authentication, 'data:approvel2')")
        public ResponseEntity<ApiResponse<LighthouseStationResponse>> approveL2(
                        @PathVariable UUID id, @RequestParam UUID approverId) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Phê duyệt L2 thành công — Da cong bo",
                                service.approveL2(id, approverId)));
        }

        @PostMapping("/{id}/reject")
        @PreAuthorize("@auth.check(authentication, 'lighthousestation:approvec1') or @auth.check(authentication, 'lighthousestation:approvec2') or @auth.check(authentication, 'lighthousestation:approvel1') or @auth.check(authentication, 'lighthousestation:approvel2') or @auth.check(authentication, 'data:approvec1') or @auth.check(authentication, 'data:approvec2')")
        public ResponseEntity<ApiResponse<LighthouseStationResponse>> reject(
                        @PathVariable UUID id,
                        @RequestParam String rejectReason,
                        @RequestParam UUID approverId) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Da từ chối",
                                service.reject(id, rejectReason, approverId)));
        }
}
