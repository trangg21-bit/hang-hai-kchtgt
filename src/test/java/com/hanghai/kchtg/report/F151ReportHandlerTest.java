package com.hanghai.kchtg.report;

import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.ChannelRouteDetailRepository;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.handler.F151ReportHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class F151ReportHandlerTest {

    @Mock
    private NavigationChannelRepository navigationChannelRepository;

    @Mock
    private ChannelRouteDetailRepository channelRouteDetailRepository;

    @Mock
    private OrgUnitRepository orgUnitRepository;

    @InjectMocks
    private F151ReportHandler handler;

    private UUID orgUnitId;
    private UUID ncId;

    @BeforeEach
    void setUp() {
        orgUnitId = UUID.randomUUID();
        ncId = UUID.randomUUID();
    }

    // ---------------------------------------------------------------
    // Test 1: getPreview produces parent+child hierarchical rows
    // ---------------------------------------------------------------
    @Test
    void testPreview_producesParentAndChildHierarchicalRows() {
        /* ── given ─────────────────────────────────────────────── */

        // One NavigationChannel parent with tram fields set
        NavigationChannel nc = NavigationChannel.builder()
                .id(ncId)
                .channelName("Luồng hàng hải A")
                .channelManagementStation("Trạm QL luồng số 1")
                .orgUnitId(orgUnitId)
                .stationAmountt(3)
                .stationArea(new BigDecimal("500"))
                .latestStationRepairDate(null)
                .createdAt(LocalDateTime.of(2025, 6, 1, 0, 0))
                .stationStaffAmount(2)
                .clearanceHeight("10m")
                .isDeleted(false)
                .build();

        // Two ChannelRouteDetail children
        ChannelRouteDetail child1 = ChannelRouteDetail.builder()
                .id(UUID.randomUUID())
                .name("Tuyến 1")
                .code("TL.01")
                .length(new BigDecimal("15.5"))
                .maxWidth(new BigDecimal("100"))
                .minWidth(new BigDecimal("80"))
                .depth(new BigDecimal("12"))
                .designSlope("1:3")
                .currentDepth("11.5m")
                .dredgingVolume(new BigDecimal("5000"))
                .publicAccess(true)
                .dedicated(false)
                .build();

        ChannelRouteDetail child2 = ChannelRouteDetail.builder()
                .id(UUID.randomUUID())
                .name("Tuyến 2")
                .code("TL.02")
                .length(new BigDecimal("8.3"))
                .maxWidth(new BigDecimal("90"))
                .minWidth(new BigDecimal("70"))
                .depth(new BigDecimal("10"))
                .designSlope("1:4")
                .currentDepth("9.8m")
                .dredgingVolume(new BigDecimal("3000"))
                .publicAccess(false)
                .dedicated(true)
                .build();

        // Mocks
        when(navigationChannelRepository.findByIsDeletedFalse(any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of(nc));
        when(channelRouteDetailRepository.findByNavigationChannelIdOrderBySequenceNoAsc(ncId))
                .thenReturn(List.of(child1, child2));
        OrgUnit orgUnit = new OrgUnit();
        orgUnit.setId(orgUnitId);
        orgUnit.setName("Cục Hàng hải");
        when(orgUnitRepository.findById(orgUnitId))
                .thenReturn(Optional.of(orgUnit));

        ReportPreviewRequest request = ReportPreviewRequest.builder()
                .reportCode("F-151")
                .orgUnitId(null)
                .startDate(LocalDate.of(2025, 1, 1))
                .build();

        /* ── when ──────────────────────────────────────────────── */
        ReportResponse response = handler.getPreview(request);

        /* ── then ──────────────────────────────────────────────── */
        assertNotNull(response);
        assertEquals("F-151", response.getCode());

        List<Map<String, Object>> rows = response.getRows();
        assertNotNull(rows);
        assertEquals(3, rows.size(),
                "Must have 3 rows: 1 parent + 2 children");

        // ---- Parent row (index 0) ----
        Map<String, Object> p = rows.get(0);
        assertEquals(1, p.get("STT"));
        assertEquals("Luồng hàng hải A", p.get("Chỉ tiêu"));
        assertEquals("Trạm QL luồng số 1", p.get("Tên trạm QL luồng"));
        assertEquals("Cục Hàng hải", p.get("ĐVQL vận hành"));
        // Sum of child length: 15.5 + 8.3 = 23.8
        assertEquals(new BigDecimal("23.8"), p.get("Dài (km)"));
        // Sum of child dredgingVolume: 5000 + 3000 = 8000
        assertEquals(new BigDecimal("8000"), p.get("KL nạo vét (m3)"));

        // ---- Child row 1 (index 1) ----
        Map<String, Object> c1 = rows.get(1);
        assertEquals("", c1.get("STT"));
        assertEquals("Tuyến 1", c1.get("Chỉ tiêu"));
        assertEquals(new BigDecimal("15.5"), c1.get("Dài (km)"));
        assertEquals("X", c1.get("Công cộng"));
        assertEquals("", c1.get("Chuyên dùng"));

        // ---- Child row 2 (index 2) ----
        Map<String, Object> c2 = rows.get(2);
        assertEquals("", c2.get("STT"));
        assertEquals("Tuyến 2", c2.get("Chỉ tiêu"));
        assertEquals("", c2.get("Công cộng"));
        assertEquals("X", c2.get("Chuyên dùng"));

        // ---- Summary ----
        Map<String, Object> summary = response.getSummary();
        assertNotNull(summary);
        assertEquals(1, summary.get("Tổng số luồng"));
    }

    // ---------------------------------------------------------------
    // Test 2: getExportData produces correct template field names
    // ---------------------------------------------------------------
    @Test
    void testExportData_providesCorrectTemplateFieldNames() {
        /* ── given ─────────────────────────────────────────────── */
        NavigationChannel nc = NavigationChannel.builder()
                .id(ncId)
                .channelName("Luồng hàng hải A")
                .channelManagementStation("Trạm QL luồng số 1")
                .orgUnitId(orgUnitId)
                .stationAmountt(3)
                .stationArea(new BigDecimal("500"))
                .latestStationRepairDate(LocalDate.of(2025, 3, 15))
                .stationStaffAmount(2)
                .clearanceHeight("10m")
                .isDeleted(false)
                .build();

        ChannelRouteDetail child1 = ChannelRouteDetail.builder()
                .id(UUID.randomUUID())
                .name("Tuyến 1")
                .code("TL.01")
                .length(new BigDecimal("15.5"))
                .maxWidth(new BigDecimal("100"))
                .minWidth(new BigDecimal("80"))
                .depth(new BigDecimal("12"))
                .designSlope("1:3")
                .currentDepth("11.5m")
                .dredgingVolume(new BigDecimal("5000"))
                .publicAccess(true)
                .dedicated(false)
                .build();

        ChannelRouteDetail child2 = ChannelRouteDetail.builder()
                .id(UUID.randomUUID())
                .name("Tuyến 2")
                .code("TL.02")
                .length(new BigDecimal("8.3"))
                .maxWidth(new BigDecimal("90"))
                .minWidth(new BigDecimal("70"))
                .depth(new BigDecimal("10"))
                .designSlope("1:4")
                .currentDepth("9.8m")
                .dredgingVolume(new BigDecimal("3000"))
                .publicAccess(false)
                .dedicated(true)
                .build();

        when(navigationChannelRepository.findByIsDeletedFalse(any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of(nc));
        when(channelRouteDetailRepository.findByNavigationChannelIdOrderBySequenceNoAsc(ncId))
                .thenReturn(List.of(child1, child2));
        OrgUnit orgUnit = new OrgUnit();
        orgUnit.setId(orgUnitId);
        orgUnit.setName("Cục Hàng hải");
        when(orgUnitRepository.findById(orgUnitId))
                .thenReturn(Optional.of(orgUnit));

        ReportPreviewRequest request = ReportPreviewRequest.builder()
                .reportCode("F-151")
                .orgUnitId(null)
                .startDate(LocalDate.of(2025, 1, 1))
                .build();

        /* ── when ──────────────────────────────────────────────── */
        List<Map<String, Object>> result = handler.getExportData(request, 2025);

        /* ── then ──────────────────────────────────────────────── */
        assertNotNull(result);
        assertEquals(3, result.size(),
                "Must have 3 rows: 1 parent + 2 children");

        // Parent row (index 0) — template field checks
        Map<String, Object> parent = result.get(0);
        assertTrue(parent.containsKey("dienTich"),
                "Parent row must contain key 'dienTich'");
        assertTrue(parent.containsKey("nhanSuBoTriTaiTramQlLuong"),
                "Parent row must contain key 'nhanSuBoTriTaiTramQlLuong'");
        assertEquals("Cục Hàng hải", parent.get("donViQuanLyVanHanh"));

        // Child row 1 (index 1) — template field checks
        Map<String, Object> r1 = result.get(1);
        assertEquals("TL.01", r1.get("maTuyenLuong"),
                "Child row should have maTuyenLuong = TL.01");
        assertTrue(r1.containsKey("daiLuong"),
                "Child row must contain key 'daiLuong'");
        assertEquals("X", r1.get("congCong"));

        // Child row 2 (index 2) — template field checks
        Map<String, Object> r2 = result.get(2);
        assertEquals("TL.02", r2.get("maTuyenLuong"),
                "Child row should have maTuyenLuong = TL.02");
        assertTrue(r2.containsKey("daiLuong"),
                "Child row must contain key 'daiLuong'");
        assertEquals("", r2.get("congCong"),
                "Child with publicAccess=false should have empty string");
    }

    // ---------------------------------------------------------------
    // Test 3: getPreview with org-unit filter
    // ---------------------------------------------------------------
    @Test
    void testPreview_filterByOrgUnit() {
        /* ── given ─────────────────────────────────────────────── */
        UUID otherOrgUnitId = UUID.randomUUID();
        UUID otherNcId = UUID.randomUUID();

        NavigationChannel matchingNc = NavigationChannel.builder()
                .id(ncId)
                .channelName("Luồng A")
                .orgUnitId(orgUnitId)
                .createdAt(LocalDateTime.of(2025, 6, 1, 0, 0))
                .isDeleted(false)
                .build();

        NavigationChannel nonMatchingNc = NavigationChannel.builder()
                .id(otherNcId)
                .channelName("Luồng B")
                .orgUnitId(otherOrgUnitId)
                .createdAt(LocalDateTime.of(2025, 6, 1, 0, 0))
                .isDeleted(false)
                .build();

        when(navigationChannelRepository.findByIsDeletedFalse(any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of(matchingNc, nonMatchingNc));

        // Only the matching nc reaches the children query
        when(channelRouteDetailRepository.findByNavigationChannelIdOrderBySequenceNoAsc(ncId))
                .thenReturn(List.of());

        // isOrgUnitRoot(targetUnitId) + resolveOrgUnitName — same id, one stub covers both
        OrgUnit filterUnit = new OrgUnit();
        filterUnit.setId(orgUnitId);
        filterUnit.setCode("CANG_VU");          // NOT "CUC_HHVT" → isOrgUnitRoot = false
        filterUnit.setName("Cảng vụ khu vực I");
        when(orgUnitRepository.findById(orgUnitId))
                .thenReturn(Optional.of(filterUnit));

        ReportPreviewRequest request = ReportPreviewRequest.builder()
                .reportCode("F-151")
                .orgUnitId(orgUnitId.toString())
                .startDate(LocalDate.of(2025, 1, 1))
                .build();

        /* ── when ──────────────────────────────────────────────── */
        ReportResponse response = handler.getPreview(request);

        /* ── then ──────────────────────────────────────────────── */
        assertNotNull(response);
        List<Map<String, Object>> rows = response.getRows();
        assertEquals(1, rows.size(),
                "Only the matching Luồng A should appear after org-unit filter");
        assertEquals("Luồng A", rows.get(0).get("Chỉ tiêu"));
    }

    // ---------------------------------------------------------------
    // Test 4: getPreview with empty data
    // ---------------------------------------------------------------
    @Test
    void testPreview_emptyData_returnsZeroRows() {
        /* ── given ─────────────────────────────────────────────── */
        when(navigationChannelRepository.findByIsDeletedFalse(any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of());

        ReportPreviewRequest request = ReportPreviewRequest.builder()
                .reportCode("F-151")
                .orgUnitId(null)
                .startDate(LocalDate.of(2025, 1, 1))
                .build();

        /* ── when ──────────────────────────────────────────────── */
        ReportResponse response = handler.getPreview(request);

        /* ── then ──────────────────────────────────────────────── */
        assertNotNull(response);
        assertNotNull(response.getRows());
        assertEquals(0, response.getRows().size(),
                "Rows must be empty when no NavigationChannel exists");
        assertNotNull(response.getSummary());
        assertEquals(0, response.getSummary().get("Tổng số luồng"));
    }

    // ---------------------------------------------------------------
    // Test 5: supports()
    // ---------------------------------------------------------------
    @Test
    void testSupports_returnsTrueForF151() {
        assertTrue(handler.supports("F-151"),
                "supports('F-151') must be true");
        assertTrue(handler.supports("f-151"),
                "supports('f-151') must be true (case-insensitive)");
        assertFalse(handler.supports("F-152"),
                "supports('F-152') must be false");
        assertFalse(handler.supports(null),
                "supports(null) must be false");
        assertFalse(handler.supports(""),
                "supports('') must be false");
    }
}
