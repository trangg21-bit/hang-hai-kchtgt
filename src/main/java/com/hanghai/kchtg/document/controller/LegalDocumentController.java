package com.hanghai.kchtg.document.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.LegalDocumentCreateRequest;
import com.hanghai.kchtg.document.dto.LegalDocumentResponse;
import com.hanghai.kchtg.document.dto.SearchResultResponse;
import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for F-128 Quản lý văn bản pháp lý.
 *
 * Endpoints:
 *   GET    /api/v1/legal-documents           — list all legal documents
 *   POST   /api/v1/legal-documents           — create a new legal document
 *   GET    /api/v1/legal-documents/{id}      — get a single legal document
 *   PUT    /api/v1/legal-documents/{id}      — update a legal document
 *   DELETE /api/v1/legal-documents/{id}      — delete a legal document
 *   GET    /api/v1/legal-documents/search    — dynamic search (F-135)
 */
@RestController
@RequestMapping("/api/v1/legal-documents")
@RequiredArgsConstructor
public class LegalDocumentController {

    private final LegalDocumentService vanBanPhapLyService;

    /**
     * GET /api/v1/legal-documents
     * Returns all legal documents.
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<Page<LegalDocumentResponse>>> listDocuments(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<LegalDocumentResponse> result = vanBanPhapLyService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * POST /api/v1/legal-documents
     * Creates a new legal document.
     */
    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'document:create')")
    public ResponseEntity<ApiResponse<LegalDocumentResponse>> createDocument(
            @RequestBody @Valid LegalDocumentCreateRequest request) {
        LegalDocumentResponse response = vanBanPhapLyService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo văn bản pháp lý thành công", response));
    }

    /**
     * GET /api/v1/legal-documents/{id}
     * Returns a single legal document by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<LegalDocumentResponse>> getDocument(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(vanBanPhapLyService.getById(id)));
    }

    /**
     * PUT /api/v1/legal-documents/{id}
     * Updates an existing legal document.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'document:update')")
    public ResponseEntity<ApiResponse<LegalDocumentResponse>> updateDocument(
            @PathVariable UUID id,
            @RequestBody @Valid LegalDocumentCreateRequest request) {
        LegalDocumentResponse response = vanBanPhapLyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật văn bản pháp lý thành công", response));
    }

    /**
     * DELETE /api/v1/legal-documents/{id}
     * Deletes a legal document.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'document:delete')")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID id) {
        vanBanPhapLyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa văn bản pháp lý thành công", null));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    /**
     * GET /api/v1/legal-documents/status/{status}
     * Filter by legal status.
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<LegalDocumentResponse>>> filterByStatus(
            @PathVariable String status) {
        ValidityStatus validityStatus = ValidityStatus.valueOf(status);
        return ResponseEntity.ok(ApiResponse.success(vanBanPhapLyService.findByValidityStatus(validityStatus)));
    }

    /**
     * GET /api/v1/legal-documents/type/{type}
     * Filter by document type.
     */
    @GetMapping("/type/{type}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<LegalDocumentResponse>>> filterByType(
            @PathVariable String type) {
        DocumentType documentType = DocumentType.valueOf(type);
        return ResponseEntity.ok(ApiResponse.success(vanBanPhapLyService.findByDocumentType(documentType)));
    }

    // ── Search Endpoint (F-135) ───────────────────────────────────────

    /**
     * GET /api/v1/legal-documents/search
     * Dynamic search with keyword, issuing body, type, status, year range (F-135).
     */
    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<SearchResultResponse>> searchDocuments(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "issuingAuthority", required = false) String issuingAuthority,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "yearStart", required = false) LocalDate yearStart,
            @RequestParam(name = "yearEnd", required = false) LocalDate yearEnd,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        SearchResultResponse result = vanBanPhapLyService.searchDocuments(
                keyword, issuingAuthority, type, status, yearStart, yearEnd, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
