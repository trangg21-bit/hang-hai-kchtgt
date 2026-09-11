package com.hanghai.kchtg.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.report.dto.Bcc157CreateRequest;
import com.hanghai.kchtg.report.entity.Bcc157Report;
import com.hanghai.kchtg.report.repository.Bcc157ReportRepository;
import com.hanghai.kchtg.report.service.Bcc157Service;
import com.hanghai.kchtg.report.service.BccReportScope;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class Bcc157ServiceTest {
    private final Bcc157ReportRepository repository = mock(Bcc157ReportRepository.class);
    private final BccReportScope scope = mock(BccReportScope.class);
    private final InfrastructureHistoryRepository history = mock(InfrastructureHistoryRepository.class);
    private final Bcc157Service service = new Bcc157Service(repository, scope, history,
            new ObjectMapper().findAndRegisterModules(), mock(OrgUnitCacheService.class));
    private final UUID unit = UUID.randomUUID();

    private Bcc157CreateRequest request() {
        return Bcc157CreateRequest.builder().orgUnitId(unit).reportYear(2026).nguonDuLieu("1")
                .assetOpeningOriginalCost(new BigDecimal("10.25"))
                .assetOriginalCostIncrease(new BigDecimal("4.125"))
                .assetOriginalCostDecrease(new BigDecimal("2"))
                .assetOpeningAccumulatedDepreciation(new BigDecimal("1"))
                .openingOriginalCostCode("  1.1  ").build();
    }

    @Test void createRecomputesBalancesAndRecordsAudit() {
        when(repository.saveAndFlush(any())).thenAnswer(call -> {
            Bcc157Report entity = call.getArgument(0); entity.setId(UUID.randomUUID()); entity.setVersion(0L);
            return entity;
        });
        var request = request(); request.setAssetClosingOriginalCost(new BigDecimal("999"));
        var result = service.create(request);
        assertEquals(new BigDecimal("12.375"), result.getAssetClosingOriginalCost());
        assertEquals(new BigDecimal("11.375"), result.getAssetClosingResidualValue());
        assertEquals("1.1", result.getOpeningOriginalCostCode());
        verify(scope).require(unit);
        var audit = ArgumentCaptor.forClass(InfrastructureHistory.class); verify(history).save(audit.capture());
        assertEquals(InfrastructureHistoryStatus.CREATED, audit.getValue().getStatus());
        assertTrue(audit.getValue().getNewValue().contains("12.375"));
    }

    @Test void negativeResidualAndExcessPrecisionCannotBeSaved() {
        var negative = request(); negative.setAssetOriginalCostDecrease(new BigDecimal("999"));
        assertThrows(IllegalArgumentException.class, () -> service.create(negative));
        var precision = request(); precision.setAssetOriginalCostIncrease(new BigDecimal("0.00001"));
        assertThrows(IllegalArgumentException.class, () -> service.create(precision));
        verify(repository, never()).saveAndFlush(any()); verifyNoInteractions(history);
    }

    @Test void staleVersionCannotOverwriteOrRecordAudit() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(Bcc157Report.builder()
                .id(id).orgUnitId(unit).version(2L).reportYear(2026).nguonDuLieu("1").build()));
        var request = request(); request.setVersion(1L);
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> service.update(id, request));
        verify(repository, never()).saveAndFlush(any()); verifyNoInteractions(history);
    }

    @Test void updateKeepsIdentityAndRecordsOldAndNewValues() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(Bcc157Report.builder()
                .id(id).orgUnitId(unit).version(2L).reportYear(2026).nguonDuLieu("1")
                .assetOpeningOriginalCost(BigDecimal.ONE).build()));
        when(repository.saveAndFlush(any())).thenAnswer(call -> {
            Bcc157Report entity = call.getArgument(0); entity.setVersion(3L); return entity;
        });
        var request = request(); request.setVersion(2L);
        var result = service.update(id, request);
        assertEquals(id, result.getId()); assertEquals(3L, result.getVersion());
        var audit = ArgumentCaptor.forClass(InfrastructureHistory.class); verify(history).save(audit.capture());
        assertEquals(InfrastructureHistoryStatus.UPDATED, audit.getValue().getStatus());
        assertNotEquals(audit.getValue().getPreviousValue(), audit.getValue().getNewValue());
    }

    @Test void noScopeCannotReadDeleteOrReadHistory() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(Bcc157Report.builder().id(id).orgUnitId(unit).build()));
        doThrow(new AccessDeniedException("scope")).when(scope).require(unit);
        assertThrows(AccessDeniedException.class, () -> service.getById(id));
        assertThrows(AccessDeniedException.class, () -> service.delete(id));
        assertThrows(AccessDeniedException.class, () -> service.history(id));
        verify(repository, never()).delete(any(Bcc157Report.class)); verifyNoInteractions(history);
    }
}
