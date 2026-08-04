package com.hanghai.kchtg.document.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.AttachedDocumentResponse;
import com.hanghai.kchtg.document.dto.LegalDocumentHistoryResponse;
import com.hanghai.kchtg.document.dto.LegalDocumentCreateRequest;
import com.hanghai.kchtg.document.dto.LegalDocumentResponse;
import com.hanghai.kchtg.document.dto.SearchResultResponse;
import com.hanghai.kchtg.document.dto.SearchSuggestionResponse;
import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.AttachedDocument;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
@Slf4j
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

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    @PreAuthorize("@auth.check(authentication, 'document:update')")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        vanBanPhapLyService.deleteAttachment(id, attachmentId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tệp đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attachmentId}/download")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        AttachedDocument attachment = vanBanPhapLyService.getAttachment(id, attachmentId);
        Resource resource = new FileSystemResource(attachment.getFilePath());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(attachment.getDocumentName()).build().toString())
                .body(resource);
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<LegalDocumentHistoryResponse>>> history(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(vanBanPhapLyService.getHistory(id)));
    }

    @PostMapping("/{id}/invalidate")
    @PreAuthorize("@auth.check(authentication, 'document:delete')")
    public ResponseEntity<ApiResponse<Void>> invalidate(@PathVariable UUID id) {
        vanBanPhapLyService.invalidate(id);
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa văn bản thành công", null));
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
     * Dynamic search with keyword, document metadata, date ranges, type and status (F-135).
     */
    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<SearchResultResponse>> searchDocuments(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "documentNumber", required = false) String documentNumber,
            @RequestParam(name = "issuingAuthority", required = false) String issuingAuthority,
            @RequestParam(name = "applicationArea", required = false) String applicationArea,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "issueDateStart", required = false) String issueDateStartStr,
            @RequestParam(name = "issueDateEnd", required = false) String issueDateEndStr,
            @RequestParam(name = "effectiveDateStart", required = false) String effectiveDateStartStr,
            @RequestParam(name = "effectiveDateEnd", required = false) String effectiveDateEndStr,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        LocalDate issueDateStart = parseLocalDate(issueDateStartStr);
        LocalDate issueDateEnd = parseLocalDate(issueDateEndStr);
        LocalDate effectiveDateStart = parseLocalDate(effectiveDateStartStr);
        LocalDate effectiveDateEnd = parseLocalDate(effectiveDateEndStr);

        SearchResultResponse result = vanBanPhapLyService.searchDocuments(
                keyword, documentNumber, issuingAuthority, applicationArea, type, status,
                issueDateStart, issueDateEnd, effectiveDateStart, effectiveDateEnd, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private LocalDate parseLocalDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        String s = dateStr.trim();
        try {
            if (s.contains("T")) {
                return java.time.OffsetDateTime.parse(s).toLocalDate();
            }
            return LocalDate.parse(s);
        } catch (Exception e) {
            try {
                return java.time.Instant.parse(s).atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            } catch (Exception ex) {
                log.warn("Could not parse date string: {}", s);
                return null;
            }
        }
    }

    @GetMapping("/suggestions")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<SearchSuggestionResponse>>> suggestions(
            @RequestParam(name = "keyword") String keyword) {
        if (keyword == null || keyword.trim().length() < 2) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(vanBanPhapLyService.getSearchSuggestion(keyword.trim())));
    }

    @GetMapping("/{id}/export")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<byte[]> exportPdf(@PathVariable UUID id) {
        LegalDocumentResponse doc = vanBanPhapLyService.getById(id);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document document = new Document(pdf);
        document.setFont(loadVietnameseFont());
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        document.add(new Paragraph("VĂN BẢN PHÁP LÝ").setBold().setFontSize(16));
        document.add(new Paragraph(" "));
        document.add(new Paragraph("Số hiệu: " + valueOrEmpty(doc.getDocumentNumber())));
        document.add(new Paragraph("Tên văn bản: " + valueOrEmpty(doc.getDocumentName())));
        document.add(new Paragraph("Loại văn bản: " + documentTypeLabel(doc.getDocumentType())));
        document.add(new Paragraph("Cơ quan ban hành: " + valueOrEmpty(doc.getIssuingAuthority())));
        document.add(new Paragraph("Người ký: " + valueOrEmpty(doc.getSigner())));
        if (doc.getIssueDate() != null) document.add(new Paragraph("Ngày ban hành: " + doc.getIssueDate().format(dateFormatter)));
        if (doc.getEffectiveDate() != null) document.add(new Paragraph("Ngày hiệu lực: " + doc.getEffectiveDate().format(dateFormatter)));
        if (doc.getExpirationDate() != null) document.add(new Paragraph("Ngày hết hiệu lực: " + doc.getExpirationDate().format(dateFormatter)));
        document.add(new Paragraph("Trạng thái: " + validityStatusLabel(doc.getValidityStatus())));
        document.close();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename((doc.getDocumentNumber() != null ? doc.getDocumentNumber() : "van-ban") + ".pdf").build());
        return new ResponseEntity<>(baos.toByteArray(), headers, HttpStatus.OK);
    }

    private PdfFont loadVietnameseFont() {
        try (InputStream fontStream = getClass().getClassLoader().getResourceAsStream("fonts/times.ttf")) {
            if (fontStream == null) {
                throw new IllegalStateException("Không tìm thấy font hỗ trợ tiếng Việt để xuất PDF");
            }
            return PdfFontFactory.createFont(fontStream.readAllBytes(), PdfEncodings.IDENTITY_H);
        } catch (IOException ex) {
            throw new IllegalStateException("Không thể tải font hỗ trợ tiếng Việt để xuất PDF", ex);
        }
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private String documentTypeLabel(DocumentType type) {
        if (type == null) return "";
        return switch (type) {
            case LAW -> "Luật";
            case DECREE -> "Nghị định";
            case CIRCULAR -> "Thông tư";
            case DECISION -> "Quyết định";
        };
    }

    private String validityStatusLabel(ValidityStatus status) {
        if (status == null) return "";
        return switch (status) {
            case DRAFT -> "Bản nháp";
            case EFFECTIVE -> "Còn hiệu lực";
            case EXPIRING_SOON -> "Sắp hết hiệu lực";
            case EXPIRED -> "Đã hết hiệu lực";
        };
    }
}
