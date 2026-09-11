package com.hanghai.kchtg.report;

import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.repository.BccAssetReportRepository;
import com.hanghai.kchtg.report.service.Bcc157Service;
import com.hanghai.kchtg.report.service.BccGeneralReportService;
import com.hanghai.kchtg.report.service.BccReportScope;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BccGeneralReportServiceTest {
    private final BccAssetReportRepository repository = mock(BccAssetReportRepository.class);
    private final BccReportScope scope = mock(BccReportScope.class);
    private final Bcc157Service saved = mock(Bcc157Service.class);
    private final BccGeneralReportService service = new BccGeneralReportService(repository, scope,
            mock(OrgUnitCacheService.class), saved);
    private final LocalDate start = LocalDate.of(2026, 1, 1);
    private final LocalDate end = LocalDate.of(2026, 12, 31);

    private ReportPreviewRequest request(String code) {
        return ReportPreviewRequest.builder().reportCode(code).startDate(start).endDate(end).build();
    }

    private Map<String, Object> asset(String date, String method, String value) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", UUID.randomUUID()); row.put("asset_type", 0);
        row.put("asset_name", "Asset"); row.put("created_at", LocalDate.parse(date));
        row.put("depreciation_start_date", LocalDate.parse(date)); row.put("disposal_method", method);
        row.put("quantity", 1); row.put("land_area", 2);
        row.put("original_value", new BigDecimal(value));
        row.put("accumulated_depreciation", new BigDecimal(value).divide(BigDecimal.TEN));
        return row;
    }

    @Test void movementUsesOpeningPlusIncreaseMinusDecreaseAndThousands() {
        when(repository.assets(any(), eq(start), eq(end), isNull(), eq(true))).thenReturn(List.of(
                asset("2025-12-31", "9", "10000"), asset("2026-01-01", "3", "4250"),
                asset("2026-12-31", "4", "2125")));
        var values = service.load(request("BCC_156")).lines().get(0).values();
        assertEquals(new BigDecimal("10"), values.get(4));
        assertEquals(new BigDecimal("4.25"), values.get(7));
        assertEquals(new BigDecimal("2.125"), values.get(10));
        assertEquals(new BigDecimal("12.125"), values.get(13));
    }

    @Test void financialUsesDepreciationYearAndBillions() {
        when(repository.assets(any(), isNull(), isNull(), isNull(), eq(true))).thenReturn(List.of(
                asset("2025-12-31", "9", "10000000000"), asset("2026-01-01", "2", "4000000000"),
                asset("2026-12-31", "6", "2000000000"), asset("2027-01-01", "2", "99000000000")));
        var request = request("F-142"); request.setDataSource("2");
        var rows = service.load(request).lines();
        assertEquals(0, new BigDecimal("12").compareTo((BigDecimal) rows.get(3).values().get(3)));
        assertEquals(0, new BigDecimal("10.8").compareTo((BigDecimal) rows.get(9).values().get(3)));
        verifyNoInteractions(saved);
    }

    @Test void emptySavedReportDoesNotFallBackToAssets() {
        when(saved.search(any())).thenReturn(List.of());
        var request = request("F-142"); request.setDataSource("1");
        assertTrue(service.load(request).lines().isEmpty());
        verifyNoInteractions(repository);
    }

    @Test void declarationUsesContentInsteadOfReportPeriod() {
        var request = request("F-143"); request.setBcNoiDung("2");
        service.load(request);
        verify(repository).assets(any(), isNull(), isNull(), eq("2"), eq(false));
    }

    @Test void processingKeepsDongAndRejectsIncorrectRecoveryMapping() {
        var request = request("F-147"); request.setProcessingMethods(List.of("0"));
        when(repository.proposals(any(), eq(List.of("0")))).thenReturn(List.of(asset("2026-01-01", "1", "123456789")));
        assertEquals(new BigDecimal("123456789"), service.load(request).lines().get(0).values().get(7));
        request.setProcessingMethods(List.of("THU_HOI"));
        assertThrows(IllegalArgumentException.class, () -> service.load(request));
    }

    @Test void exploitationAggregatesEachAssetOnceAndPreservesTemplateBlockOrder() {
        var leased = asset("2026-01-01", "1", "1000"); leased.put("total_revenue", new BigDecimal("4250"));
        var secondLease = new HashMap<>(leased); secondLease.put("total_revenue", new BigDecimal("2125"));
        var operated = asset("2026-01-01", "2", "1000");
        when(repository.exploitations(any(), eq(start), eq(end))).thenReturn(List.of(leased, secondLease, operated));
        var lines = service.load(request("F-146")).lines();
        assertEquals(2, lines.size()); assertEquals("2", lines.get(0).block());
        assertEquals("1", lines.get(1).block());
        assertEquals(new BigDecimal("6.375"), lines.get(1).values().get(10));
    }

    @Test void invalidDateRangeIsRejectedBeforeQuerying() {
        var request = request("F-141"); request.setStartDate(end); request.setEndDate(start);
        assertThrows(IllegalArgumentException.class, () -> service.load(request));
        verifyNoInteractions(repository);
    }

    @Test void scopeIntersectsSubtreeAndDeniesOtherUnits() {
        var orgService = mock(OrgUnitScopeService.class); var reportScope = new BccReportScope(orgService);
        UUID parent = UUID.randomUUID(), child = UUID.randomUUID(), foreign = UUID.randomUUID();
        when(orgService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(List.of(parent, child)));
        when(orgService.resolveSubtreeIds(parent)).thenReturn(List.of(parent, child, foreign));
        assertEquals(List.of(parent, child), reportScope.resolve(parent));
        assertThrows(AccessDeniedException.class, () -> reportScope.resolve(foreign));
        assertThrows(AccessDeniedException.class, () -> reportScope.require(foreign));
    }

    @Test void missingScopeReturnsEmptyInsteadOfUnrestricted() {
        var orgService = mock(OrgUnitScopeService.class);
        when(orgService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(List.of()));
        assertEquals(List.of(), new BccReportScope(orgService).resolve(null));
    }
}
