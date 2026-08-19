package com.hanghai.kchtg.beacon.controller;

import com.hanghai.kchtg.beacon.dto.beacon_light.BeaconLightResponse;
import com.hanghai.kchtg.beacon.dto.beacon_light.CreateBeaconLightRequest;
import com.hanghai.kchtg.beacon.dto.beacon_light.UpdateBeaconLightRequest;
import com.hanghai.kchtg.beacon.service.BeaconLightService;
import com.hanghai.kchtg.common.dto.ApiResponse;
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
 * REST Controller for BeaconLight CRUD + approval endpoints (F-068 to F-072).
 */
@RestController
@RequestMapping("/api/beacon-lights")
@RequiredArgsConstructor
@DataScope
public class BeaconLightController {

        private final BeaconLightService beaconLightService;

        @GetMapping
        @PreAuthorize("@auth.check(authentication, 'beaconlight:read') or @auth.check(authentication, 'data:read')")
        public ResponseEntity<ApiResponse<List<BeaconLightResponse>>> findAll() {
                return ResponseEntity.ok(ApiResponse.success(beaconLightService.findAll()));
        }

        @GetMapping("/{id}")
        @PreAuthorize("@auth.check(authentication, 'beaconlight:read') or @auth.check(authentication, 'data:read')")
        public ResponseEntity<ApiResponse<BeaconLightResponse>> findById(
                        @PathVariable UUID id) {
                return ResponseEntity.ok(ApiResponse.success(beaconLightService.findById(id)));
        }

        @GetMapping("/search")
        @PreAuthorize("@auth.check(authentication, 'beaconlight:read') or @auth.check(authentication, 'data:read')")
        public ResponseEntity<ApiResponse<List<BeaconLightResponse>>> search(
                        @RequestParam(required = false) String name,
                        @RequestParam(required = false) String code,
                        @RequestParam(required = false) String type,
                        @RequestParam(required = false) String status) {
                return ResponseEntity.ok(ApiResponse.success(
                                beaconLightService.search(name, code, type, status)));
        }

        @GetMapping("/search-paged")
        @PreAuthorize("@auth.check(authentication, 'beaconlight:read') or @auth.check(authentication, 'data:read')")
        public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<BeaconLightResponse>>> searchPaged(
                        @RequestParam(required = false) String name,
                        @RequestParam(required = false) String code,
                        @RequestParam(required = false) String type,
                        @RequestParam(required = false) String status,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page,
                                size);
                return ResponseEntity.ok(ApiResponse.success(
                                beaconLightService.searchPaged(name, code, type, status, pageable)));
        }

        @PostMapping
        @PreAuthorize("@auth.check(authentication, 'beaconlight:create') or @auth.check(authentication, 'data:create')")
        public ResponseEntity<ApiResponse<BeaconLightResponse>> create(
                        @Valid @RequestBody CreateBeaconLightRequest request) {
                BeaconLightResponse response = beaconLightService.create(request);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Tạo đèn biển thành công", response));
        }

        @PutMapping("/{id}")
        @PreAuthorize("@auth.check(authentication, 'beaconlight:update') or @auth.check(authentication, 'data:update')")
        public ResponseEntity<ApiResponse<BeaconLightResponse>> update(
                        @PathVariable UUID id,
                        @Valid @RequestBody UpdateBeaconLightRequest request) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Cập nhật đèn biển thành công",
                                beaconLightService.update(id, request)));
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("@auth.check(authentication, 'beaconlight:delete') or @auth.check(authentication, 'data:delete')")
        public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
                beaconLightService.delete(id);
                return ResponseEntity.ok(
                                ApiResponse.success("Đã xóa đèn biển thành công", null));
        }

        @PostMapping("/{id}/submit-approval")
        @PreAuthorize("@auth.check(authentication, 'beaconlight:create') or @auth.check(authentication, 'beaconlight:update') or @auth.check(authentication, 'data:create') or @auth.check(authentication, 'data:update')")
        public ResponseEntity<ApiResponse<Void>> submitForApproval(
                        @PathVariable UUID id) {
                beaconLightService.submitForApproval(id);
                return ResponseEntity.ok(
                                ApiResponse.success("Đã gửi phê duyệt", null));
        }

        @PostMapping("/{id}/approve-l1")
        @PreAuthorize("@auth.check(authentication, 'beaconlight:approvec1') or @auth.check(authentication, 'beaconlight:approvel1') or @auth.check(authentication, 'data:approvec1') or @auth.check(authentication, 'data:approvel1')")
        public ResponseEntity<ApiResponse<BeaconLightResponse>> approveL1(
                        @PathVariable UUID id, @RequestParam java.util.UUID approverId) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Phê duyệt L1 thành công",
                                beaconLightService.approveL1(id, approverId)));
        }

        @PostMapping("/{id}/approve-l2")
        @PreAuthorize("@auth.check(authentication, 'beaconlight:approvec2') or @auth.check(authentication, 'beaconlight:approvel2') or @auth.check(authentication, 'data:approvec2') or @auth.check(authentication, 'data:approvel2')")
        public ResponseEntity<ApiResponse<BeaconLightResponse>> approveL2(
                        @PathVariable UUID id, @RequestParam java.util.UUID approverId) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Phê duyệt L2 thành công — Đã công bố",
                                beaconLightService.approveL2(id, approverId)));
        }

        @PostMapping("/{id}/reject")
        @PreAuthorize("@auth.check(authentication, 'beaconlight:approvec1') or @auth.check(authentication, 'beaconlight:approvec2') or @auth.check(authentication, 'beaconlight:approvel1') or @auth.check(authentication, 'beaconlight:approvel2') or @auth.check(authentication, 'data:approvec1') or @auth.check(authentication, 'data:approvec2')")
        public ResponseEntity<ApiResponse<BeaconLightResponse>> reject(
                        @PathVariable UUID id,
                        @RequestParam String rejectReason,
                        @RequestParam java.util.UUID approverId) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Đã từ chối",
                                beaconLightService.reject(id, rejectReason, approverId)));
        }
}
