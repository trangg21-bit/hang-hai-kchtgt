package com.hanghai.kchtg.document;

import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.document.dto.LegalDocumentCreateRequest;
import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.LegalDocument;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import com.hanghai.kchtg.document.repository.AttachedDocumentRepository;
import com.hanghai.kchtg.document.repository.LegalDocumentRepository;
import com.hanghai.kchtg.document.repository.SearchLogRepository;
import com.hanghai.kchtg.document.repository.SearchResultRepository;
import com.hanghai.kchtg.document.repository.SearchSuggestionRepository;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import com.hanghai.kchtg.document.entity.LegalDocumentHistoryAction;
import com.hanghai.kchtg.document.entity.SearchSuggestion;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LegalDocumentServiceTest {

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

    @Test
    void create_allowsDocumentNumberAfterPreviousSoftDelete() {
        when(legalDocumentRepository.existsByDocumentNumberAndDeletedAtIsNull("SSS")).thenReturn(false);
        when(legalDocumentRepository.save(any(LegalDocument.class)))
                .thenAnswer(invocation -> {
                    LegalDocument doc = invocation.getArgument(0);
                    org.springframework.test.util.ReflectionTestUtils.setField(doc, "id", UUID.randomUUID());
                    return doc;
                });
        lenient().when(approvalHistoryRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(userRepository.findAllById(any())).thenReturn(java.util.Collections.emptyList());
        lenient().when(userRepository.findById(any())).thenReturn(java.util.Optional.empty());

        var response = service.create(LegalDocumentCreateRequest.builder()
                .documentName("Văn bản mới")
                .documentNumber("SSS")
                .validityStatus(ValidityStatus.EFFECTIVE)
                .build());

        assertThat(response.getDocumentNumber()).isEqualTo("SSS");
        verify(legalDocumentRepository).existsByDocumentNumberAndDeletedAtIsNull("SSS");
    }

    @Test
    void findAllUsesActiveQuery() {
        when(legalDocumentRepository.findActive(any(Sort.class))).thenReturn(List.of());

        assertThat(service.findAll()).isEmpty();

        verify(legalDocumentRepository).findActive(any(Sort.class));
    }

    @Test
    void findAllResolvesUpdatedByNameWithOneBatchLookup() {
        UUID userId = UUID.randomUUID();
        LegalDocument document = LegalDocument.builder().documentName("Test document").build();
        document.setUpdatedBy(userId);
        User user = new User();
        user.setId(userId);
        user.setFullName("Nguyen Van Test");
        user.setUsername("test.user");
        when(legalDocumentRepository.findActive(any(Sort.class))).thenReturn(List.of(document));
        when(userRepository.findAllById(any())).thenReturn(List.of(user));

        var responses = service.findAll();

        assertThat(responses).singleElement().extracting(response -> response.getUpdatedByName())
                .isEqualTo("Nguyen Van Test");
        verify(userRepository, times(1)).findAllById(any());
    }

    @Test
    void deleteMarksDocumentAsSoftDeleted() {
        UUID id = UUID.randomUUID();
        LegalDocument document = LegalDocument.builder()
                .documentName("Văn bản cần xóa")
                .documentNumber("DEL-01")
                .build();
        document.setId(id);
        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));
        when(legalDocumentRepository.save(document)).thenReturn(document);

        service.delete(id);

        assertThat(document.getDeletedAt()).isNotNull();
        verify(legalDocumentRepository).save(document);
    }

    @Test
    void create_shouldThrowWhenEffectiveDateBeforeIssueDate() {
        LegalDocumentCreateRequest request = LegalDocumentCreateRequest.builder()
                .documentName("Văn bản ngày sai")
                .issueDate(LocalDate.of(2026, 5, 10))
                .effectiveDate(LocalDate.of(2026, 5, 1))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.create(request));
        assertThat(ex.getMessage()).contains("Ngày hiệu lực phải sau hoặc bằng ngày ban hành");
    }

    @Test
    void create_shouldThrowWhenExpirationDateBeforeEffectiveDate() {
        LegalDocumentCreateRequest request = LegalDocumentCreateRequest.builder()
                .documentName("Văn bản hết hạn sai")
                .issueDate(LocalDate.of(2026, 1, 1))
                .effectiveDate(LocalDate.of(2026, 1, 15))
                .expirationDate(LocalDate.of(2026, 1, 10))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.create(request));
        assertThat(ex.getMessage()).contains("Ngày hết hiệu lực phải sau hoặc bằng ngày có hiệu lực");
    }

    @Test
    void update_shouldThrowWhenEditingExpiredDocument() {
        UUID id = UUID.randomUUID();
        LegalDocument document = LegalDocument.builder()
                .documentName("Văn bản đã hết hiệu lực")
                .validityStatus(ValidityStatus.EXPIRED)
                .build();
        document.setId(id);

        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));

        LegalDocumentCreateRequest updateReq = LegalDocumentCreateRequest.builder()
                .documentName("Thử sửa tên")
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.update(id, updateReq));
        assertThat(ex.getMessage()).contains("Không thể sửa văn bản đã hết hiệu lực");
    }

    @Test
    void invalidate_shouldChangeStatusToExpiredAndRecordHistory() {
        UUID id = UUID.randomUUID();
        LegalDocument document = LegalDocument.builder()
                .documentName("Văn bản vô hiệu hóa")
                .validityStatus(ValidityStatus.EFFECTIVE)
                .build();
        document.setId(id);

        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));

        service.invalidate(id);

        assertThat(document.getValidityStatus()).isEqualTo(ValidityStatus.EXPIRED);
        verify(legalDocumentRepository).save(document);
        verify(approvalHistoryRepository).save(any());
    }

    @Test
    void getHistory_shouldReturnHistoryList() {
        UUID id = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LegalDocument document = LegalDocument.builder().documentName("Doc with history").build();
        document.setId(id);

        InfrastructureHistory history1 = InfrastructureHistory.builder()
                .refId(id)
                .refType(InfrastructureType.LEGAL_DOCUMENT)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.CREATED)
                .approvedBy(userId)
                .approvedDate(LocalDateTime.now())
                .changedField("Doc with history")
                .build();

        var orgUnit = com.hanghai.kchtg.orgunit.entity.OrgUnit.builder().name("Cục Hàng hải Việt Nam").build();
        var user = new User();
        user.setId(userId);
        user.setFullName("Nguyễn Văn An");
        user.setOrgUnit(orgUnit);

        when(legalDocumentRepository.findById(id)).thenReturn(Optional.of(document));
        when(approvalHistoryRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.LEGAL_DOCUMENT, id))
                .thenReturn(List.of(history1));
        when(userRepository.findAllById(List.of(userId))).thenReturn(List.of(user));

        var histories = service.getHistory(id);

        assertThat(histories).hasSize(1);
        assertThat(histories.get(0).getAction()).isEqualTo(LegalDocumentHistoryAction.CREATED);
        assertThat(histories.get(0).getChangedByName()).isEqualTo("Nguyễn Văn An");
        assertThat(histories.get(0).getOrgUnitName()).isEqualTo("Cục Hàng hải Việt Nam");
    }

    @Test
    void getSearchSuggestion_shouldReturnFilteredSuggestions() {
        SearchSuggestion s1 = SearchSuggestion.builder()
                .keyword("Luật giao thông")
                .searchCount(10)
                .lastSearchedAt(LocalDateTime.now())
                .build();
        SearchSuggestion s2 = SearchSuggestion.builder()
                .keyword("Luật biển")
                .searchCount(2) // searchCount < 5 so will be filtered out by getSearchSuggestion
                .lastSearchedAt(LocalDateTime.now())
                .build();

        when(searchSuggestionRepository.findByKeywordContainingIgnoreCase("Luật"))
                .thenReturn(List.of(s1, s2));

        var suggestions = service.getSearchSuggestion("Luật");

        assertThat(suggestions).hasSize(1);
        assertThat(suggestions.get(0).getKeyword()).isEqualTo("Luật giao thông");
    }
}
