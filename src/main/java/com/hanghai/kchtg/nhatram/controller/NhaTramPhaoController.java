package com.hanghai.kchtg.nhatram.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.nhatram.dto.phao.CreateNhaTramPhaoRequest;
import com.hanghai.kchtg.nhatram.dto.phao.NhaTramPhaoResponse;
import com.hanghai.kchtg.nhatram.dto.phao.UpdateNhaTramPhaoRequest;
import com.hanghai.kchtg.nhatram.entity.BuoyType;
import com.hanghai.kchtg.nhatram.entity.NhaTramStatus;
import com.hanghai.kchtg.nhatram.service.NhaTramPhaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller cho CRUD + duyet nha tram phao (F-080 den F-085).
 */
@RestController
@RequestMapping("/api/v1/nhatram/phao")
@RequiredArgsConstructor
public class NhaTramPhaoController {

    private final NhaTramPhaoService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NhaTramPhaoResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NhaTramPhaoResponse>> findById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<NhaTramPhaoResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) BuoyType type,
            @RequestParam(required = false) NhaTramStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
                service.search(name, code, type, status)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NhaTramPhaoResponse>> create(
            @Valid @RequestBody CreateNhaTramPhaoRequest request) {
        NhaTramPhaoResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao nha tram phao thanh cong", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NhaTramPhaoResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateNhaTramPhaoRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cap nhat nha tram phao thanh cong",
                service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Da xoa nha tram phao thanh cong", null));
    }

    @PostMapping("/{id}/submit-approval")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(
            @PathVariable UUID id) {
        service.submitForApproval(id);
        return ResponseEntity.ok(
                ApiResponse.success("Da gui phe duyet", null));
    }

    @PostMapping("/{id}/approve-l1")
    public ResponseEntity<ApiResponse<NhaTramPhaoResponse>> approveL1(
            @PathVariable UUID id, @RequestParam String approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phe duyet L1 thanh cong",
                service.approveL1(id, approverId)));
    }

    @PostMapping("/{id}/approve-l2")
    public ResponseEntity<ApiResponse<NhaTramPhaoResponse>> approveL2(
            @PathVariable UUID id, @RequestParam String approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phe duyet L2 thanh cong — Da cong bo",
                service.approveL2(id, approverId)));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<NhaTramPhaoResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String rejectReason,
            @RequestParam String approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Da tu choi",
                service.reject(id, rejectReason, approverId)));
    }
}
