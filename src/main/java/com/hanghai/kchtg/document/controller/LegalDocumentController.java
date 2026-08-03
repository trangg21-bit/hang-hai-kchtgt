package com.hanghai.kchtg.document.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.AttachedDocumentResponse;
import com.hanghai.kchtg.document.dto.LegalDocumentCreateRequest;
import com.hanghai.kchtg.document.dto.LegalDocumentResponse;
import com.hanghai.kchtg.document.dto.SearchResultResponse;
import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
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

    /**
     * POST /api/v1/legal-documents/{id}/attachments
     * Upload a file attachment to a legal document.
     */
    @PostMapping("/{id}/attachments")
    @PreAuthorize("@auth.check(authentication, 'document:update')")
    public ResponseEntity<ApiResponse<AttachedDocumentResponse>> uploadFile(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        AttachedDocumentResponse attached = vanBanPhapLyService.uploadAttachment(id, file);
        return ResponseEntity.ok(ApiResponse.success("Tải lên thành công", attached));
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
            @RequestParam(name = "applicationArea", required = false) String applicationArea,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "yearStart", required = false) LocalDate yearStart,
            @RequestParam(name = "yearEnd", required = false) LocalDate yearEnd,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        SearchResultResponse result = vanBanPhapLyService.searchDocuments(
                keyword, issuingAuthority, applicationArea, type, status, yearStart, yearEnd, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}/export")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<byte[]> exportPdf(@PathVariable UUID id) {
        LegalDocumentResponse doc = vanBanPhapLyService.getById(id);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document document = new Document(pdf);
        document.add(new Paragraph("VĂN BẢN PHÁP LÝ").setBold().setFontSize(16));
        document.add(new Paragraph(" "));
        document.add(new Paragraph("Số hiệu: " + (doc.getDocumentNumber() != null ? doc.getDocumentNumber() : "")));
        document.add(new Paragraph("Tên văn bản: " + doc.getDocumentName()));
        document.add(new Paragraph("Loại văn bản: " + (doc.getDocumentType() != null ? doc.getDocumentType().name() : "")));
        document.add(new Paragraph("Cơ quan ban hành: " + (doc.getIssuingAuthority() != null ? doc.getIssuingAuthority() : "")));
        document.add(new Paragraph("Người ký: " + (doc.getSigner() != null ? doc.getSigner() : "")));
        if (doc.getIssueDate() != null) document.add(new Paragraph("Ngày ban hành: " + doc.getIssueDate().toString()));
        if (doc.getEffectiveDate() != null) document.add(new Paragraph("Ngày hiệu lực: " + doc.getEffectiveDate().toString()));
        if (doc.getExpirationDate() != null) document.add(new Paragraph("Ngày hết hiệu lực: " + doc.getExpirationDate().toString()));
        document.add(new Paragraph("Trạng thái: " + (doc.getValidityStatus() != null ? doc.getValidityStatus().name() : "")));
        document.close();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename((doc.getDocumentNumber() != null ? doc.getDocumentNumber() : "van-ban") + ".pdf").build());
        return new ResponseEntity<>(baos.toByteArray(), headers, HttpStatus.OK);
    }
}
