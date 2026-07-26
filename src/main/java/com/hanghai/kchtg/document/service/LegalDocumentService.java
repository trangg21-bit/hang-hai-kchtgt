package com.hanghai.kchtg.document.service;

import java.util.UUID;

import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
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

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public LegalDocumentResponse create(LegalDocumentCreateRequest request) {
        log.info("Creating LegalDocument: {}", request.getDocumentName());

        if (request.getDocumentNumber() != null && legalDocumentRepository.existsByDocumentNumber(request.getDocumentNumber())) {
            throw new IllegalArgumentException("Số hiệu văn bản pháp lý đã tồn tại: " + request.getDocumentNumber());
        }

        LegalDocument vb = LegalDocument.builder()
                .documentName(request.getDocumentName())
                .documentNumber(request.getDocumentNumber())
                .issuingAuthority(request.getIssuingAuthority())
                .issueDate(request.getIssueDate())
                .effectiveDate(request.getEffectiveDate())
                .expirationDate(request.getExpirationDate())
                .documentType(request.getDocumentType())
                .applicationArea(request.getApplicationArea())
                .validityStatus(request.getValidityStatus())
                .signer(request.getSigner())
                .description(request.getDescription())
                .createdBy(request.getCreatedBy())
                .build();

        LegalDocument saved = Objects.requireNonNull(legalDocumentRepository.save(vb));
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
        return legalDocumentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdDate"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<LegalDocumentResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        return legalDocumentRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public LegalDocumentResponse update(UUID id, LegalDocumentCreateRequest request) {
        LegalDocument vb = legalDocumentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy văn bản với id: " + id));

        if (request.getDocumentName() != null) vb.setDocumentName(request.getDocumentName());
        if (request.getDocumentNumber() != null) {
            if (legalDocumentRepository.existsByDocumentNumberAndIdNot(request.getDocumentNumber(), id)) {
                throw new IllegalArgumentException("Số hiệu văn bản pháp lý đã tồn tại: " + request.getDocumentNumber());
            }
            vb.setDocumentNumber(request.getDocumentNumber());
        }
        if (request.getIssuingAuthority() != null) vb.setIssuingAuthority(request.getIssuingAuthority());
        if (request.getIssueDate() != null) vb.setIssueDate(request.getIssueDate());
        if (request.getEffectiveDate() != null) vb.setEffectiveDate(request.getEffectiveDate());
        if (request.getExpirationDate() != null) vb.setExpirationDate(request.getExpirationDate());
        if (request.getDocumentType() != null) vb.setDocumentType(request.getDocumentType());
        if (request.getApplicationArea() != null) vb.setApplicationArea(request.getApplicationArea());
        if (request.getValidityStatus() != null) vb.setValidityStatus(request.getValidityStatus());
        if (request.getSigner() != null) vb.setSigner(request.getSigner());
        if (request.getDescription() != null) vb.setDescription(request.getDescription());

        return toResponse(Objects.requireNonNull(legalDocumentRepository.save(vb)));
    }

    @Transactional
    public void delete(UUID id) {
        if (!legalDocumentRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy văn bản với id: " + id);
        }
        legalDocumentRepository.deleteById(id);
        log.info("Deleted LegalDocument with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> findByValidityStatus(ValidityStatus tinhTrang) {
        return legalDocumentRepository.findByValidityStatus(tinhTrang)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> findByDocumentType(DocumentType loai) {
        return legalDocumentRepository.findByDocumentType(loai)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> searchByDocumentNameContaining(String keyword) {
        return legalDocumentRepository.findByDocumentNameContaining(keyword)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> searchByCoQuanBanHanhContaining(String coQuan) {
        return legalDocumentRepository.findByIssuingAuthorityContaining(coQuan)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SearchResultResponse searchDocuments(String keyword, String coQuan, String loai,
                                                  String tinhTrang, LocalDate yearStart,
                                                  LocalDate yearEnd, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        
        com.hanghai.kchtg.document.entity.DocumentType loaiEnum = (loai != null && !loai.isEmpty()) 
                ? com.hanghai.kchtg.document.entity.DocumentType.valueOf(loai) : null;
        com.hanghai.kchtg.document.entity.ValidityStatus tinhTrangEnum = (tinhTrang != null && !tinhTrang.isEmpty()) 
                ? com.hanghai.kchtg.document.entity.ValidityStatus.valueOf(tinhTrang) : null;

        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        String coQuanLike = (coQuan != null && !coQuan.trim().isEmpty()) ? "%" + coQuan.trim().toLowerCase() + "%" : null;

        Page<LegalDocument> result = legalDocumentRepository.searchDocuments(
                keywordLike, coQuanLike, loaiEnum, tinhTrangEnum, yearStart, yearEnd, pageable);
        return SearchResultResponse.builder()
                .results(result.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
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
        return goiYList.stream().map(g -> SearchSuggestionResponse.builder()
                        .id(g.getId())
                        .keyword(g.getKeyword())
                        .searchCount(g.getSearchCount())
                        .lastSearchedAt(g.getLastSearchedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private LegalDocumentResponse toResponse(LegalDocument vb) {
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
                .createdDate(vb.getCreatedDate())
                .updatedBy(vb.getUpdatedBy())
                .updatedDate(vb.getUpdatedDate())
                .attachedDocuments(taiLieuList)
                .build();
    }
}
