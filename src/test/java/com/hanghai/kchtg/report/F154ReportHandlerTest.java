package com.hanghai.kchtg.report;

import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.port.entity.BuoyBerth;
import com.hanghai.kchtg.port.entity.WaterZone;
import com.hanghai.kchtg.port.entity.WaterZoneType;
import com.hanghai.kchtg.port.repository.BuoyBerthRepository;
import com.hanghai.kchtg.port.repository.WaterZoneRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.handler.F154ReportHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class F154ReportHandlerTest {

    @Mock
    private WaterZoneRepository waterZoneRepository;

    @Mock
    private BuoyBerthRepository buoyBerthRepository;

    @Mock
    private OrgUnitRepository orgUnitRepository;

    @InjectMocks
    private F154ReportHandler handler;

    private UUID orgUnitId;

    @BeforeEach
    void setUp() {
        orgUnitId = UUID.randomUUID();
    }

    @Test
    void testSupports() {
        assertTrue(handler.supports("F-154"));
        assertTrue(handler.supports("f-154"));
    }

    @Test
    void testGetPreview_returnsTwoMatrixRows() {
        WaterZone wz1 = WaterZone.builder()
                .waterZoneCode("WZ-01")
                .waterZoneName("Khu chuyển tải A")
                .waterZoneType(WaterZoneType.TRANSSHIPMENT)
                .orgUnitId(orgUnitId)
                .createdAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .build();
        wz1.setId(UUID.randomUUID());

        WaterZone wz2 = WaterZone.builder()
                .waterZoneCode("WZ-02")
                .waterZoneName("Khu neo đậu B")
                .waterZoneType(WaterZoneType.ANCHORAGE)
                .orgUnitId(orgUnitId)
                .createdAt(LocalDateTime.of(2025, 6, 1, 0, 0))
                .build();
        wz2.setId(UUID.randomUUID());

        BuoyBerth bb1 = BuoyBerth.builder()
                .orgUnitId(orgUnitId)
                .createdAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .build();
        bb1.setId(UUID.randomUUID());

        when(waterZoneRepository.findAll(any(Sort.class))).thenReturn(List.of(wz1, wz2));
        when(buoyBerthRepository.findAll()).thenReturn(List.of(bb1));

        ReportPreviewRequest request = new ReportPreviewRequest();
        request.setStartDate(LocalDate.of(2025, 1, 1));

        ReportResponse response = handler.getPreview(request);

        assertNotNull(response);
        assertEquals(2, response.getRows().size());
        assertEquals("I", response.getRows().get(0).get("STT"));
        assertEquals("Số lượng khu hiện có", response.getRows().get(0).get("Chỉ tiêu"));
        assertEquals(1L, response.getRows().get(0).get("Khu chuyển tải có phao neo"));
        assertEquals(1L, response.getRows().get(0).get("Khu neo đậu"));

        assertEquals("II", response.getRows().get(1).get("STT"));
        assertEquals("Số lượng khu trú tăng thêm", response.getRows().get(1).get("Chỉ tiêu"));
        assertEquals(1L, response.getRows().get(1).get("Khu neo đậu"));
    }

    @Test
    void testExport_producesTemplateKeys() {
        WaterZone wz1 = WaterZone.builder()
                .waterZoneCode("WZ-03")
                .waterZoneName("Khu chuyển tải không phao")
                .waterZoneType(WaterZoneType.TRANSSHIPMENT)
                .orgUnitId(orgUnitId)
                .createdAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .build();
        wz1.setId(UUID.randomUUID());

        when(waterZoneRepository.findAll(any(Sort.class))).thenReturn(List.of(wz1));
        when(buoyBerthRepository.findAll()).thenReturn(List.of());

        ReportPreviewRequest request = new ReportPreviewRequest();
        request.setStartDate(LocalDate.of(2025, 1, 1));

        List<Map<String, Object>> data = handler.getExportData(request, 2025);

        assertNotNull(data);
        assertEquals(1, data.size());
        assertEquals(1L, data.get(0).get("soLuongHienCoKhuChuyenTaiKhongCoPhaoNeo"));
        assertEquals(0L, data.get(0).get("soLuongHienCoKhuChuyenTaiCoPhaoNeo"));
        assertEquals(0L, data.get(0).get("soLuongTangThemKhuChuyenTaiKhongCoPhaoNeo"));
    }
}
