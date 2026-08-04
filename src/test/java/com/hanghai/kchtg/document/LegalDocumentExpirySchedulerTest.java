package com.hanghai.kchtg.document;

import com.hanghai.kchtg.document.entity.LegalDocument;
import com.hanghai.kchtg.document.entity.LegalDocumentHistoryAction;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import com.hanghai.kchtg.document.repository.LegalDocumentRepository;
import com.hanghai.kchtg.document.scheduler.LegalDocumentExpiryScheduler;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LegalDocumentExpirySchedulerTest {

    @Mock
    private LegalDocumentRepository repo;

    @Mock
    private LegalDocumentService legalDocumentService;

    @InjectMocks
    private LegalDocumentExpiryScheduler scheduler;

    @Test
    void checkExpiringDocuments_shouldMarkEffectiveAsExpiringSoon() {
        LocalDate today = LocalDate.now();
        LegalDocument doc = LegalDocument.builder()
                .documentName("Văn bản sắp hết hạn")
                .documentNumber("EXP-01")
                .validityStatus(ValidityStatus.EFFECTIVE)
                .expirationDate(today.plusDays(10))
                .build();

        when(repo.findByExpirationDateBetweenAndValidityStatusAndDeletedAtIsNull(
                eq(today), eq(today.plusDays(30)), eq(ValidityStatus.EFFECTIVE)))
                .thenReturn(List.of(doc));
        when(repo.findByExpirationDateBeforeAndValidityStatusInAndDeletedAtIsNull(eq(today), any()))
                .thenReturn(List.of());

        scheduler.checkExpiringDocuments();

        assertThat(doc.getValidityStatus()).isEqualTo(ValidityStatus.EXPIRING_SOON);
        verify(legalDocumentService).recordSystemHistory(doc, LegalDocumentHistoryAction.STATUS_CHANGED);
        verify(repo).saveAll(List.of(doc));
    }

    @Test
    void checkExpiringDocuments_shouldMarkOverdueAsExpired() {
        LocalDate today = LocalDate.now();
        LegalDocument doc = LegalDocument.builder()
                .documentName("Văn bản đã hết hạn")
                .documentNumber("EXP-02")
                .validityStatus(ValidityStatus.EXPIRING_SOON)
                .expirationDate(today.minusDays(2))
                .build();

        when(repo.findByExpirationDateBetweenAndValidityStatusAndDeletedAtIsNull(
                eq(today), eq(today.plusDays(30)), eq(ValidityStatus.EFFECTIVE)))
                .thenReturn(List.of());
        when(repo.findByExpirationDateBeforeAndValidityStatusInAndDeletedAtIsNull(eq(today), any()))
                .thenReturn(List.of(doc));

        scheduler.checkExpiringDocuments();

        assertThat(doc.getValidityStatus()).isEqualTo(ValidityStatus.EXPIRED);
        verify(legalDocumentService).recordSystemHistory(doc, LegalDocumentHistoryAction.STATUS_CHANGED);
        verify(repo).saveAll(List.of(doc));
    }

    @Test
    void checkExpiringDocuments_whenNoMatchingDocuments_shouldNotSave() {
        LocalDate today = LocalDate.now();
        when(repo.findByExpirationDateBetweenAndValidityStatusAndDeletedAtIsNull(
                eq(today), eq(today.plusDays(30)), eq(ValidityStatus.EFFECTIVE)))
                .thenReturn(List.of());
        when(repo.findByExpirationDateBeforeAndValidityStatusInAndDeletedAtIsNull(eq(today), any()))
                .thenReturn(List.of());

        scheduler.checkExpiringDocuments();

        verify(repo, never()).saveAll(any());
        verify(legalDocumentService, never()).recordSystemHistory(any(), any());
    }
}
