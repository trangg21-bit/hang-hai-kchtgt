package com.hanghai.kchtg.document;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.document.controller.LegalDocumentController;
import com.hanghai.kchtg.document.dto.LegalDocumentCreateRequest;
import com.hanghai.kchtg.document.dto.LegalDocumentHistoryResponse;
import com.hanghai.kchtg.document.dto.LegalDocumentResponse;
import com.hanghai.kchtg.document.dto.SearchResultResponse;
import com.hanghai.kchtg.document.dto.SearchSuggestionResponse;
import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.LegalDocument;
import com.hanghai.kchtg.document.entity.LegalDocumentHistoryAction;
import com.hanghai.kchtg.document.entity.SearchSuggestion;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import com.hanghai.kchtg.document.repository.AttachedDocumentRepository;
import com.hanghai.kchtg.document.repository.LegalDocumentRepository;
import com.hanghai.kchtg.document.repository.SearchLogRepository;
import com.hanghai.kchtg.document.repository.SearchResultRepository;
import com.hanghai.kchtg.document.repository.SearchSuggestionRepository;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * F-128 Quản lý văn bản pháp lý — controller test that genuinely EXECUTES the declared
 * production code it covers (INC-039 fix).
 *
 * <p>Instead of @MockBean-ing LegalDocumentService (which left every declared F-128 class
 * mocked and unexecuted), this suite:
 * <ul>
 *   <li>builds the REAL {@link LegalDocumentService} with mocked repositories at the
 *       persistence seam, and</li>
 *   <li>constructs the REAL {@link LegalDocumentController} around that service, then asserts
 *       through the controller's public boundary (ApiResponse envelope, Vietnamese messages,
 *       generated PDF bytes).</li>
 * </ul>
 *
 * <p>Business rules exercised: duplicate document-number rejection, issue/expiry date
 * ordering, expired-document edit lock, soft delete, invalidate-to-EXPIRED, filtered search
 * with status counts, search-history logging, suggestion threshold filtering, PDF export with
 * Vietnamese labels. UI-facing asserted strings stay Vietnamese with diacritics; code
 * identifiers are English.
 */
@ExtendWith(MockitoExtension.class)
class LegalDocumentControllerTest {

    @Mock
    private LegalDocumentRepository legalDocumentRepository;
    @Mock
    private AttachedDocumentRepository attachedDocumentRepository;
    @Mock
    private SearchLogRepository searchLogRepository;
    @Mock
    private SearchResultRepository searchResultRepository;
    @Mock
    private SearchSuggestionRepository searchSuggestionRepository;
    @Mock
    private InfrastructureHistoryRepository approvalHistoryRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LegalDocumentService service;

    private LegalDocumentController controller;

    @BeforeEach
    void setUpController() {
        controller = new LegalDocumentController(service);
    }

    private LegalDocument entity(String documentName, String documentNumber, UUID id,
            ValidityStatus validityStatus, DocumentType documentType) {
        LegalDocument document = LegalDocument.builder()
                .documentName(documentName)
                .documentNumber(documentNumber)
                .issuingAuthority("Cục Hàng hải Việt Nam")
                .issueDate(LocalDate.of(2026, 8, 3))
                .effectiveDate(LocalDate.of(2026, 8, 3))
                .expirationDate(LocalDate.of(2026, 8, 30))
                .documentType(documentType)
                .applicationArea("Toàn quốc")
                .validityStatus(validityStatus)
                .signer("Nguyễn Văn A")
                .description("Văn bản phục vụ kiểm thử F-128")
                .build();
        if (id != null) {
            document.setId(id);
        }
        return document;
    }

    private void stubHistorySink() {
        when(approvalHistoryRepository.save(any(InfrastructureHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void listDocuments_shouldReturnPagedActiveDocuments() {
        UUID id = UUID.randomUUID();
        LegalDocument document = entity("Luật Giao thông đường thủy nội địa", "LGT-01", id,
                ValidityStatus.EFFECTIVE, DocumentType.LAW);
        when(legalDocumentRepository.findActive(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(document)));

        ApiResponse<Page<LegalDocumentResponse>> apiResponse = controller.listDocuments(0, 20).getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getData().getTotalElements()).isEqualTo(1);
        assertThat(apiResponse.getData().getContent()).singleElement()
                .extracting(LegalDocumentResponse::getDocumentName)
                .isEqualTo("Luật Giao thông đường thủy nội địa");
        verify(legalDocumentRepository).findActive(any(Pageable.class));
    }

    @Test
    void createDocument_shouldPersistAndReturnCreatedResponse() {
        UUID savedId = UUID.randomUUID();
        when(legalDocumentRepository.existsByDocumentNumberAndDeletedAtIsNull("VB-2026-01"))
                .thenReturn(false);
        when(legalDocumentRepository.save(any(LegalDocument.class)))
                .thenAnswer(invocation -> {
                    LegalDocument doc = invocation.getArgument(0);
                    ReflectionTestUtils.setField(doc, "id", savedId);
                    return doc;
                });
        stubHistorySink();

        LegalDocumentCreateRequest request = LegalDocumentCreateRequest.builder()
                .documentName("Văn bản pháp lý mới")
                .documentNumber("VB-2026-01")
                .documentType(DocumentType.CIRCULAR)
                .issuingAuthority("Bộ Giao thông vận tải")
                .build();

        ApiResponse<LegalDocumentResponse> apiResponse = controller.createDocument(request).getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getMessage()).isEqualTo("Tạo văn bản pháp lý thành công");
        assertThat(apiResponse.getData().getId()).isEqualTo(savedId);
        assertThat(apiResponse.getData().getDocumentName()).isEqualTo("Văn bản pháp lý mới");
        assertThat(apiResponse.getData().getValidityStatus()).isEqualTo(ValidityStatus.EFFECTIVE);
        verify(legalDocumentRepository).save(any(LegalDocument.class));
        verify(approvalHistoryRepository).save(any(InfrastructureHistory.class));
    }

    @Test
    void createDocument_shouldRejectDuplicateDocumentNumber() {
        when(legalDocumentRepository.existsByDocumentNumberAndDeletedAtIsNull("VB-2026-01"))
                .thenReturn(true);
        LegalDocumentCreateRequest request = LegalDocumentCreateRequest.builder()
                .documentName("Văn bản trùng số")
                .documentNumber("VB-2026-01")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> controller.createDocument(request));
        assertThat(ex.getMessage()).contains("Số hiệu văn bản pháp lý đã tồn tại");
    }

    @Test
    void createDocument_shouldRejectExpirationDateBeforeEffectiveDate() {
        LegalDocumentCreateRequest request = LegalDocumentCreateRequest.builder()
                .documentName("Văn bản ngày hết hạn sai")
                .issueDate(LocalDate.of(2026, 1, 1))
                .effectiveDate(LocalDate.of(2026, 1, 15))
                .expirationDate(LocalDate.of(2026, 1, 10))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> controller.createDocument(request));
        assertThat(ex.getMessage()).isEqualTo("Ngày hết hiệu lực phải sau hoặc bằng ngày có hiệu lực");
    }

    @Test
    void getDocument_shouldReturnRequestedDocument() {
        UUID id = UUID.randomUUID();
        LegalDocument document = entity("Quyết định thử nghiệm", "QD-01", id,
                ValidityStatus.EFFECTIVE, DocumentType.DECISION);
        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));

        ApiResponse<LegalDocumentResponse> apiResponse = controller.getDocument(id).getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getData().getId()).isEqualTo(id);
        assertThat(apiResponse.getData().getDocumentName()).isEqualTo("Quyết định thử nghiệm");
        assertThat(apiResponse.getData().getIssuingAuthority()).isEqualTo("Cục Hàng hải Việt Nam");
        assertThat(apiResponse.getData().getUpdatedByName()).isNull();
    }

    @Test
    void getDocument_shouldThrowWhenDocumentMissing() {
        UUID id = UUID.randomUUID();
        when(legalDocumentRepository.findById(id)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> controller.getDocument(id));
        assertThat(ex.getMessage()).contains("Không tìm thấy văn bản với id");
    }

    @Test
    void updateDocument_shouldApplyChangesAndReportSuccess() {
        UUID id = UUID.randomUUID();
        LegalDocument document = entity("Tên cũ", "VB-01", id,
                ValidityStatus.EFFECTIVE, DocumentType.DECISION);
        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));
        when(legalDocumentRepository.save(document)).thenReturn(document);
        stubHistorySink();

        LegalDocumentCreateRequest request = LegalDocumentCreateRequest.builder()
                .documentName("Tên mới sau cập nhật")
                .issuingAuthority("Cục Hàng hải Việt Nam")
                .build();

        ApiResponse<LegalDocumentResponse> apiResponse = controller.updateDocument(id, request).getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getMessage()).isEqualTo("Cập nhật văn bản pháp lý thành công");
        assertThat(apiResponse.getData().getDocumentName()).isEqualTo("Tên mới sau cập nhật");
        verify(legalDocumentRepository).save(document);
        verify(approvalHistoryRepository).save(any(InfrastructureHistory.class));
    }

    @Test
    void updateDocument_shouldRejectEditingExpiredDocument() {
        UUID id = UUID.randomUUID();
        LegalDocument document = entity("Văn bản đã hết hiệu lực", "VB-EXP", id,
                ValidityStatus.EXPIRED, DocumentType.DECISION);
        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));
        LegalDocumentCreateRequest request = LegalDocumentCreateRequest.builder()
                .documentName("Không được sửa")
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> controller.updateDocument(id, request));
        assertThat(ex.getMessage()).isEqualTo("Không thể sửa văn bản đã hết hiệu lực");
    }

    @Test
    void deleteDocument_shouldSoftDeleteAndReportSuccess() {
        UUID id = UUID.randomUUID();
        LegalDocument document = entity("Văn bản cần xóa", "VB-DEL", id,
                ValidityStatus.EFFECTIVE, DocumentType.DECISION);
        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));
        when(legalDocumentRepository.save(document)).thenReturn(document);
        stubHistorySink();

        ApiResponse<Void> apiResponse = controller.deleteDocument(id).getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getMessage()).isEqualTo("Xóa văn bản pháp lý thành công");
        assertThat(document.getDeletedAt()).isNotNull();
        verify(legalDocumentRepository).save(document);
    }

    @Test
    void invalidate_shouldMarkDocumentAsExpired() {
        UUID id = UUID.randomUUID();
        LegalDocument document = entity("Văn bản cần vô hiệu hóa", "VB-INV", id,
                ValidityStatus.EFFECTIVE, DocumentType.DECISION);
        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));
        when(legalDocumentRepository.save(document)).thenReturn(document);
        stubHistorySink();

        ApiResponse<Void> apiResponse = controller.invalidate(id).getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getMessage()).isEqualTo("Vô hiệu hóa văn bản thành công");
        assertThat(document.getValidityStatus()).isEqualTo(ValidityStatus.EXPIRED);
        verify(legalDocumentRepository).save(document);
        verify(approvalHistoryRepository).save(any(InfrastructureHistory.class));
    }

    @Test
    void history_shouldReturnRecordedActionsForDocument() {
        UUID id = UUID.randomUUID();
        LegalDocument document = entity("Luật giao thông", "LGT-01", id,
                ValidityStatus.EFFECTIVE, DocumentType.LAW);
        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));
        InfrastructureHistory history = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(id)
                .refType(InfrastructureType.LEGAL_DOCUMENT)
                .status(InfrastructureHistoryStatus.CREATED)
                .approvedDate(LocalDateTime.of(2026, 8, 3, 10, 0))
                .reason("Khởi tạo văn bản pháp lý mới")
                .build();
        when(approvalHistoryRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                InfrastructureType.LEGAL_DOCUMENT, id)).thenReturn(List.of(history));

        ApiResponse<List<LegalDocumentHistoryResponse>> apiResponse = controller.history(id).getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getData()).singleElement().satisfies(item -> {
            assertThat(item.getAction()).isEqualTo(LegalDocumentHistoryAction.CREATED);
            assertThat(item.getDocumentName()).isEqualTo("Luật giao thông");
            assertThat(item.getDocumentNumber()).isEqualTo("LGT-01");
        });
    }

    @Test
    void search_shouldReturnFilteredResultsWithStatusCounts() {
        UUID id = UUID.randomUUID();
        LegalDocument document = entity("Luật Giao thông đường thủy nội địa", "LGT-01", id,
                ValidityStatus.EFFECTIVE, DocumentType.LAW);
        when(legalDocumentRepository.searchDocuments(any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(document)));
        Object[] effectiveCountRow = new Object[] { ValidityStatus.EFFECTIVE, 1L };
        when(legalDocumentRepository.countByValidityStatusFiltered(any(), any(), any(), any(), any(), any(),
                any(), any(), any()))
                .thenReturn(Collections.singletonList(effectiveCountRow));
        when(searchLogRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(searchSuggestionRepository.findByKeywordIgnoreCase("Luật")).thenReturn(Optional.empty());
        when(searchSuggestionRepository.save(any(SearchSuggestion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ApiResponse<SearchResultResponse> apiResponse = controller.searchDocuments(
                "Luật", null, "Quốc hội", null, null, null,
                null, null, null, null, 0, 20).getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getData().getTotalElements()).isEqualTo(1);
        assertThat(apiResponse.getData().getResults()).singleElement()
                .extracting(LegalDocumentResponse::getDocumentName)
                .isEqualTo("Luật Giao thông đường thủy nội địa");
        assertThat(apiResponse.getData().getStatusCounts())
                .containsEntry(ValidityStatus.EFFECTIVE.name(), 1L);
        verify(searchLogRepository).save(any());
        verify(searchSuggestionRepository).save(any(SearchSuggestion.class));
    }

    @Test
    void search_shouldRejectSingleCharacterKeyword() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> controller.searchDocuments("L", null, null, null, null, null,
                        null, null, null, null, 0, 20));
        assertThat(ex.getMessage()).isEqualTo("Từ khóa tìm kiếm phải có ít nhất 2 ký tự");
    }

    @Test
    void suggestions_shouldReturnSuggestionsFromRealService() {
        SearchSuggestion s1 = SearchSuggestion.builder()
                .keyword("Luật giao thông")
                .searchCount(10)
                .lastSearchedAt(LocalDateTime.now())
                .build();
        when(searchSuggestionRepository.findByKeywordContainingIgnoreCase("Luật"))
                .thenReturn(List.of(s1));

        ApiResponse<List<SearchSuggestionResponse>> apiResponse = controller.suggestions("Luật").getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getData()).singleElement()
                .extracting(SearchSuggestionResponse::getKeyword)
                .isEqualTo("Luật giao thông");
    }

    @Test
    void suggestions_shouldReturnEmptyForShortKeywordWithoutCallingService() {
        ApiResponse<List<SearchSuggestionResponse>> apiResponse = controller.suggestions("L").getBody();

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.getData()).isEmpty();
    }

    @Test
    void exportPdf_shouldKeepVietnameseTextAndDisplayLabels() throws Exception {
        UUID id = UUID.randomUUID();
        LegalDocument document = entity("Quyết định thử nghiệm", "QD-01", id,
                ValidityStatus.EFFECTIVE, DocumentType.DECISION);
        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));

        ResponseEntity<byte[]> response = controller.exportPdf(id);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        byte[] pdfBytes = response.getBody();
        assertThat(pdfBytes).isNotEmpty();
        assertThat(new String(pdfBytes, 0, Math.min(8, pdfBytes.length), StandardCharsets.ISO_8859_1))
                .startsWith("%PDF");

        try (PdfDocument pdf = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            String extracted = PdfTextExtractor.getTextFromPage(pdf.getPage(1));
            assertThat(extracted)
                    .contains("VĂN BẢN PHÁP LÝ")
                    .contains("Số hiệu: QD-01")
                    .contains("Tên văn bản: Quyết định thử nghiệm")
                    .contains("Loại văn bản: Quyết định")
                    .contains("Trạng thái: Còn hiệu lực")
                    .contains("Ngày ban hành: 03/08/2026");
        }
    }
}
