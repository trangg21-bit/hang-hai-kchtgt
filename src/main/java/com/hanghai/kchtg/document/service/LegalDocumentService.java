package com.hanghai.kchtg.document.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.repository.*;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class LegalDocumentService {

    private final LegalDocumentRepository legalDocumentRepository;
    private final AttachedDocumentRepository attachedDocumentRepository;
    private final SearchLogRepository searchLogRepository;
    private final SearchResultRepository searchResultRepository;
    private final SearchSuggestionRepository searchSuggestionRepository;
    private final LegalDocumentHistoryRepository legalDocumentHistoryRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.legal-document-path:uploads/legal-documents}")
    private String uploadDir;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public LegalDocumentResponse create(LegalDocumentCreateRequest request) {
        log.info("Creating LegalDocument: {}", request.getDocumentName());

        if (request.getDocumentNumber() != null
                && legalDocumentRepository.existsByDocumentNumberAndDeletedAtIsNull(request.getDocumentNumber())) {
            throw new IllegalArgumentException("Số hiệu văn bản pháp lý đã tồn tại: " + request.getDocumentNumber());
        }

        if (request.getEffectiveDate() != null && request.getIssueDate() != null
                && request.getEffectiveDate().isBefore(request.getIssueDate())) {
            throw new IllegalArgumentException("Ngày hiệu lực phải sau hoặc bằng ngày ban hành");
        }
        if (request.getExpirationDate() != null && request.getEffectiveDate() != null
                && request.getExpirationDate().isBefore(request.getEffectiveDate())) {
            throw new IllegalArgumentException("Ngày hết hiệu lực phải sau hoặc bằng ngày có hiệu lực");
        }

        boolean draft = Boolean.TRUE.equals(request.getDraft());
        LegalDocument vb = LegalDocument.builder()
                .documentName(request.getDocumentName())
                .documentNumber(request.getDocumentNumber())
                .issuingAuthority(request.getIssuingAuthority())
                .issueDate(request.getIssueDate())
                .effectiveDate(request.getEffectiveDate())
                .expirationDate(request.getExpirationDate())
                .documentType(request.getDocumentType())
                .applicationArea(request.getApplicationArea())
                .validityStatus(draft ? ValidityStatus.DRAFT :
                        (request.getValidityStatus() == null ? ValidityStatus.EFFECTIVE : request.getValidityStatus()))
                .signer(request.getSigner())
                .description(request.getDescription())
                .createdBy(request.getCreatedBy())
                .build();

        LegalDocument saved = Objects.requireNonNull(legalDocumentRepository.save(vb));
        recordHistory(saved, draft ? LegalDocumentHistoryAction.DRAFT_SAVED : LegalDocumentHistoryAction.CREATED,
                draft ? "Lưu bản nháp văn bản" : "Khởi tạo văn bản pháp lý mới");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public LegalDocumentResponse getById(UUID id) {
        LegalDocument vb = legalDocumentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy văn bản với id: " + id));
        return toResponse(vb);
    }

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> findAll() {
        List<LegalDocument> documents = legalDocumentRepository.findActive(Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return toResponses(documents);
    }

    @Transactional(readOnly = true)
    public Page<LegalDocumentResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        Page<LegalDocument> documents = legalDocumentRepository.findActive(pageable);
        Map<UUID, String> displayNames = loadUserDisplayNames(documents.getContent());
        return documents.map(document -> toResponse(document, displayNames));
    }

    @Transactional
    public LegalDocumentResponse update(UUID id, LegalDocumentCreateRequest request) {
        LegalDocument vb = legalDocumentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy văn bản với id: " + id));

        if (vb.getValidityStatus() == ValidityStatus.EXPIRED) {
            throw new IllegalStateException("Không thể sửa văn bản đã hết hiệu lực");
        }

        List<String> changes = new ArrayList<>();
        if (request.getDocumentName() != null && !request.getDocumentName().equals(vb.getDocumentName())) {
            changes.add("Tên văn bản");
            vb.setDocumentName(request.getDocumentName());
        }
        if (request.getDocumentNumber() != null && !request.getDocumentNumber().equals(vb.getDocumentNumber())) {
            if (!request.getDocumentNumber().equals(vb.getDocumentNumber()) && 
                legalDocumentRepository.existsByDocumentNumberAndIdNotAndDeletedAtIsNull(request.getDocumentNumber(), id)) {
                throw new IllegalArgumentException("Số hiệu văn bản pháp lý đã tồn tại: " + request.getDocumentNumber());
            }
            changes.add("Số hiệu");
            vb.setDocumentNumber(request.getDocumentNumber());
        }
        if (request.getIssuingAuthority() != null && !request.getIssuingAuthority().equals(vb.getIssuingAuthority())) {
            changes.add("Cơ quan ban hành");
            vb.setIssuingAuthority(request.getIssuingAuthority());
        }
        if (request.getIssueDate() != null && !Objects.equals(request.getIssueDate(), vb.getIssueDate())) {
            if (request.getEffectiveDate() != null && request.getEffectiveDate().isBefore(request.getIssueDate())) {
                throw new IllegalArgumentException("Ngày hiệu lực phải sau hoặc bằng ngày ban hành");
            }
            changes.add("Ngày ban hành");
            vb.setIssueDate(request.getIssueDate());
        }
        if (request.getEffectiveDate() != null && !Objects.equals(request.getEffectiveDate(), vb.getEffectiveDate())) {
            changes.add("Ngày có hiệu lực");
            vb.setEffectiveDate(request.getEffectiveDate());
        }
        if (request.getExpirationDate() != null && !Objects.equals(request.getExpirationDate(), vb.getExpirationDate())) {
            changes.add("Ngày hết hiệu lực");
            vb.setExpirationDate(request.getExpirationDate());
        }
        if (vb.getEffectiveDate() != null && vb.getIssueDate() != null
                && vb.getEffectiveDate().isBefore(vb.getIssueDate())) {
            throw new IllegalArgumentException("Ngày hiệu lực phải sau hoặc bằng ngày ban hành");
        }
        if (vb.getExpirationDate() != null && vb.getEffectiveDate() != null
                && vb.getExpirationDate().isBefore(vb.getEffectiveDate())) {
            throw new IllegalArgumentException("Ngày hết hiệu lực phải sau hoặc bằng ngày có hiệu lực");
        }
        if (request.getDocumentType() != null && request.getDocumentType() != vb.getDocumentType()) {
            changes.add("Loại văn bản");
            vb.setDocumentType(request.getDocumentType());
        }
        if (request.getApplicationArea() != null && !request.getApplicationArea().equals(vb.getApplicationArea())) {
            changes.add("Phạm vi áp dụng");
            vb.setApplicationArea(request.getApplicationArea());
        }
        if (request.getSigner() != null && !request.getSigner().equals(vb.getSigner())) {
            changes.add("Người ký");
            vb.setSigner(request.getSigner());
        }
        if (request.getDescription() != null && !request.getDescription().equals(vb.getDescription())) {
            changes.add("Mô tả");
            vb.setDescription(request.getDescription());
        }

        if (Boolean.TRUE.equals(request.getDraft())) vb.setValidityStatus(ValidityStatus.DRAFT);
        LegalDocument saved = Objects.requireNonNull(legalDocumentRepository.save(vb));
        String note = changes.isEmpty() ? "Cập nhật thông tin văn bản" : "Cập nhật: " + String.join(", ", changes);
        recordHistory(saved, Boolean.TRUE.equals(request.getDraft()) ? LegalDocumentHistoryAction.DRAFT_SAVED : LegalDocumentHistoryAction.UPDATED, note);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        LegalDocument vb = legalDocumentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy văn bản với id: " + id));
        vb.softDelete(SecurityUtils.getCurrentUserId());
        legalDocumentRepository.save(vb);
        recordHistory(vb, LegalDocumentHistoryAction.DELETED, "Xóa văn bản pháp lý");
        log.info("Soft-deleted LegalDocument with id: {}", id);
    }

    @Transactional(readOnly = true)
    public List<LegalDocumentHistoryResponse> getHistory(UUID id) {
        legalDocumentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy văn bản với id: " + id));
        List<LegalDocumentHistory> histories = legalDocumentHistoryRepository.findByLegalDocumentIdOrderByChangedAtDesc(id);
        List<UUID> userIds = histories.stream()
                .map(LegalDocumentHistory::getChangedBy)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, String> displayNames = userIds.isEmpty() ? Map.of() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, this::getDisplayName, (first, ignored) -> first));

        return histories.stream()
                .map(h -> toHistoryResponse(h, displayNames))
                .collect(Collectors.toList());
    }

    @Transactional
    public void invalidate(UUID id) {
        LegalDocument vb = legalDocumentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy văn bản với id: " + id));
        vb.setValidityStatus(ValidityStatus.EXPIRED);
        legalDocumentRepository.save(vb);
        recordHistory(vb, LegalDocumentHistoryAction.EXPIRED);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> findByValidityStatus(ValidityStatus status) {
        return toResponses(legalDocumentRepository.findByValidityStatusAndDeletedAtIsNull(status));
    }

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> findByDocumentType(DocumentType type) {
        return toResponses(legalDocumentRepository.findByDocumentTypeAndDeletedAtIsNull(type));
    }

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> searchByDocumentNameContaining(String keyword) {
        return toResponses(legalDocumentRepository.findByDocumentNameContainingAndDeletedAtIsNull(keyword));
    }

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> searchByCoQuanBanHanhContaining(String coQuan) {
        return toResponses(legalDocumentRepository.findByIssuingAuthorityContainingAndDeletedAtIsNull(coQuan));
    }

    @Transactional
    public SearchResultResponse searchDocuments(String keyword, String documentNumber, String issuingAuthority,
                                                  String applicationArea, String type, String status,
                                                  LocalDate issueDateStart, LocalDate issueDateEnd,
                                                  LocalDate effectiveDateStart, LocalDate effectiveDateEnd,
                                                  int page, int size) {
        if (keyword != null && !keyword.trim().isEmpty() && keyword.trim().length() < 2) {
            throw new IllegalArgumentException("Từ khóa tìm kiếm phải có ít nhất 2 ký tự");
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.UPDATED_AT));

        DocumentType typeEnum = (type != null && !type.isEmpty())
                ? DocumentType.valueOf(type) : null;
        ValidityStatus statusEnum = (status != null && !status.isEmpty())
                ? ValidityStatus.valueOf(status) : null;

        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        String documentNumberLike = (documentNumber != null && !documentNumber.trim().isEmpty()) ? "%" + documentNumber.trim().toLowerCase() + "%" : null;
        String issuingAuthorityPattern = (issuingAuthority != null && !issuingAuthority.trim().isEmpty()) ? "%" + issuingAuthority.trim().toLowerCase() + "%" : null;
        String applicationAreaPattern = (applicationArea != null && !applicationArea.trim().isEmpty()) ? "%" + applicationArea.trim().toLowerCase() + "%" : null;

        Page<LegalDocument> result = legalDocumentRepository.searchDocuments(
                keywordLike, documentNumberLike, issuingAuthorityPattern, applicationAreaPattern, typeEnum, statusEnum,
                issueDateStart, issueDateEnd, effectiveDateStart, effectiveDateEnd, pageable);
        recordSearch(keyword, issuingAuthority, applicationArea, type, status, result.getTotalElements());

        Map<String, Long> counts = new java.util.LinkedHashMap<>();
        for (Object[] row : legalDocumentRepository.countByValidityStatusFiltered(
                keywordLike, documentNumberLike, issuingAuthorityPattern, applicationAreaPattern,
                typeEnum, issueDateStart, issueDateEnd, effectiveDateStart, effectiveDateEnd)) {
            counts.put(((ValidityStatus) row[0]).name(), (Long) row[1]);
        }

        return SearchResultResponse.builder()
                .results(toResponses(result.getContent()))
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .statusCounts(counts)
                .build();
    }

    /**
     * Log search query (F-134).
     */
    @Transactional
    public void logSearch(SearchLog timKiemLog) {
        log.info("Logging search: {}", timKiemLog.getKeyword());
        searchLogRepository.save(timKiemLog);
    }

    /**
     * Get search suggestions for a keyword (F-134).
     */
    @Transactional(readOnly = true)
    public List<SearchSuggestionResponse> getSearchSuggestion(String keyword) {
        List<SearchSuggestion> goiYList = searchSuggestionRepository.findByKeywordContainingIgnoreCase(keyword);
        return goiYList.stream()
                .filter(g -> g.getSearchCount() != null && g.getSearchCount() >= 5)
                .map(g -> SearchSuggestionResponse.builder()
                        .id(g.getId())
                        .keyword(g.getKeyword())
                        .searchCount(g.getSearchCount())
                        .lastSearchedAt(g.getLastSearchedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private List<LegalDocumentResponse> toResponses(Collection<LegalDocument> documents) {
        Map<UUID, String> displayNames = loadUserDisplayNames(documents);
        return documents.stream()
                .map(document -> toResponse(document, displayNames))
                .collect(Collectors.toList());
    }

    private Map<UUID, String> loadUserDisplayNames(Collection<LegalDocument> documents) {
        List<UUID> userIds = documents.stream()
                .map(LegalDocument::getUpdatedBy)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (userIds.isEmpty()) {
            return Map.of();
        }
        List<User> users = userRepository.findAllById(userIds);
        if (users == null) {
            return Map.of();
        }
        return users.stream()
                .collect(Collectors.toMap(User::getId, this::getDisplayName, (first, ignored) -> first));
    }

    private String getDisplayName(User user) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getUsername();
    }

    private LegalDocumentResponse toResponse(LegalDocument vb) {
        return toResponse(vb, loadUserDisplayNames(List.of(vb)));
    }

    private LegalDocumentResponse toResponse(LegalDocument vb, Map<UUID, String> displayNames) {
        List<AttachedDocumentResponse> taiLieuList = new ArrayList<>();
        if (vb.getAttachedDocuments() != null) {
            taiLieuList = vb.getAttachedDocuments().stream()
                    .map(tl -> AttachedDocumentResponse.builder()
                            .id(tl.getId())
                            .documentName(tl.getDocumentName())
                            .filePath(tl.getFilePath())
                            .fileSize(tl.getFileSize())
                            .uploadedAt(tl.getUploadedAt())
                            .build())
                    .collect(Collectors.toList());
        }
        return LegalDocumentResponse.builder()
                .id(vb.getId())
                .documentName(vb.getDocumentName())
                .documentNumber(vb.getDocumentNumber())
                .issuingAuthority(vb.getIssuingAuthority())
                .issueDate(vb.getIssueDate())
                .effectiveDate(vb.getEffectiveDate())
                .expirationDate(vb.getExpirationDate())
                .documentType(vb.getDocumentType())
                .applicationArea(vb.getApplicationArea())
                .validityStatus(vb.getValidityStatus())
                .signer(vb.getSigner())
                .description(vb.getDescription())
                .createdBy(vb.getCreatedBy())
                .createdDate(vb.getCreatedAt())
                .updatedBy(vb.getUpdatedBy())
                .updatedByName(vb.getUpdatedBy() == null ? null : displayNames.get(vb.getUpdatedBy()))
                .updatedDate(vb.getUpdatedAt())
                .attachedDocuments(taiLieuList)
                .draft(vb.getValidityStatus() == ValidityStatus.DRAFT)
                .build();
    }

    private void recordSearch(String keyword, String issuingAuthority, String applicationArea,
                              String type, String status, long resultCount) {
        String normalizedKeyword = keyword == null ? null : keyword.trim();
        if (normalizedKeyword == null || normalizedKeyword.length() < 2) return;
        String filters = String.format("issuingAuthority=%s;applicationArea=%s;type=%s;status=%s",
                issuingAuthority, applicationArea, type, status);
        searchLogRepository.save(SearchLog.builder()
                .searchedBy(SecurityUtils.getCurrentUserId() == null ? null : SecurityUtils.getCurrentUserId().toString())
                .keyword(normalizedKeyword)
                .filters(filters)
                .resultCount((int) Math.min(Integer.MAX_VALUE, resultCount))
                .build());
        SearchSuggestion suggestion = searchSuggestionRepository.findByKeywordIgnoreCase(normalizedKeyword)
                .orElseGet(() -> SearchSuggestion.builder().keyword(normalizedKeyword).searchCount(0).build());
        suggestion.setSearchCount((suggestion.getSearchCount() == null ? 0 : suggestion.getSearchCount()) + 1);
        suggestion.setLastSearchedAt(LocalDateTime.now());
        searchSuggestionRepository.save(suggestion);
    }

    private void recordHistory(LegalDocument document, LegalDocumentHistoryAction action, String note) {
        legalDocumentHistoryRepository.save(LegalDocumentHistory.builder()
                .legalDocument(document)
                .action(action)
                .changedBy(SecurityUtils.getCurrentUserId())
                .changedAt(LocalDateTime.now())
                .documentName(document.getDocumentName())
                .documentNumber(document.getDocumentNumber())
                .issuingAuthority(document.getIssuingAuthority())
                .issueDate(document.getIssueDate())
                .effectiveDate(document.getEffectiveDate())
                .expirationDate(document.getExpirationDate())
                .documentType(document.getDocumentType())
                .applicationArea(document.getApplicationArea())
                .validityStatus(document.getValidityStatus())
                .signer(document.getSigner())
                .description(note != null ? note : document.getDescription())
                .build());
    }

    private void recordHistory(LegalDocument document, LegalDocumentHistoryAction action) {
        recordHistory(document, action, null);
    }

    public void recordSystemHistory(LegalDocument document, LegalDocumentHistoryAction action) {
        recordHistory(document, action, null);
    }

    private LegalDocumentHistoryResponse toHistoryResponse(LegalDocumentHistory history, Map<UUID, String> displayNames) {
        return LegalDocumentHistoryResponse.builder()
                .id(history.getId())
                .action(history.getAction())
                .changedBy(history.getChangedBy())
                .changedByName(history.getChangedBy() == null ? null : displayNames.get(history.getChangedBy()))
                .changedAt(history.getChangedAt())
                .documentName(history.getDocumentName())
                .documentNumber(history.getDocumentNumber())
                .issuingAuthority(history.getIssuingAuthority())
                .issueDate(history.getIssueDate())
                .effectiveDate(history.getEffectiveDate())
                .expirationDate(history.getExpirationDate())
                .documentType(history.getDocumentType())
                .applicationArea(history.getApplicationArea())
                .validityStatus(history.getValidityStatus())
                .signer(history.getSigner())
                .description(history.getDescription())
                .note(history.getDescription())
                .build();
    }
    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
            ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png");

    @Transactional
    public AttachedDocumentResponse uploadAttachment(UUID legalDocumentId, MultipartFile file) {
        LegalDocument vb = legalDocumentRepository.findById(legalDocumentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy văn bản với id: " + legalDocumentId));

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Kích thước file không được vượt quá 10MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Tên file không được để trống");
        }

        String extension = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot >= 0) {
            extension = originalFilename.substring(dot).toLowerCase();
        }
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Định dạng file không được hỗ trợ: " + extension
                    + ". Chỉ chấp nhận PDF, DOC, DOCX, JPG, JPEG, PNG");
        }
        Path directory = Paths.get(uploadDir).toAbsolutePath().normalize();
        String safeName = Paths.get(originalFilename).getFileName().toString();
        Path destination = directory.resolve(legalDocumentId + "_" + System.currentTimeMillis() + "_" + safeName).normalize();
        if (!destination.startsWith(directory)) {
            throw new IllegalArgumentException("Tên tệp không hợp lệ");
        }

        try {
            Files.createDirectories(directory);
            file.transferTo(destination.toFile());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lưu file: " + e.getMessage());
        }

        AttachedDocument attached = AttachedDocument.builder()
                .legalDocument(vb)
                .documentName(originalFilename)
                .filePath(destination.toString())
                .fileSize(file.getSize())
                .uploadedAt(LocalDate.now())
                .build();
        attached = attachedDocumentRepository.save(attached);
        recordHistory(vb, LegalDocumentHistoryAction.ATTACHMENT_UPLOADED, "Tải lên tệp đính kèm: " + originalFilename);

        log.info("Uploaded attachment '{}' for LegalDocument id={}", originalFilename, legalDocumentId);

        return AttachedDocumentResponse.builder()
                .id(attached.getId())
                .documentName(attached.getDocumentName())
                .filePath(attached.getFilePath())
                .fileSize(attached.getFileSize())
                .uploadedAt(attached.getUploadedAt())
                .build();
    }

    @Transactional
    public void deleteAttachment(UUID legalDocumentId, UUID attachmentId) {
        AttachedDocument attachment = attachedDocumentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tệp đính kèm"));
        if (!attachment.getLegalDocument().getId().equals(legalDocumentId)) {
            throw new IllegalArgumentException("Tệp đính kèm không thuộc văn bản này");
        }
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (IOException e) {
            log.warn("Không thể xóa tệp vật lý {}", attachment.getFilePath(), e);
        }
        attachedDocumentRepository.delete(attachment);
        recordHistory(attachment.getLegalDocument(), LegalDocumentHistoryAction.ATTACHMENT_DELETED, "Xóa tệp đính kèm: " + attachment.getDocumentName());
    }

    @Transactional(readOnly = true)
    public AttachedDocument getAttachment(UUID legalDocumentId, UUID attachmentId) {
        AttachedDocument attachment = attachedDocumentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tệp đính kèm"));
        if (!attachment.getLegalDocument().getId().equals(legalDocumentId)) {
            throw new IllegalArgumentException("Tệp đính kèm không thuộc văn bản này");
        }
        return attachment;
    }
}
