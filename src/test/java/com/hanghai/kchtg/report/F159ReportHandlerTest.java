package com.hanghai.kchtg.report;

import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.handler.F159ReportHandler;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.station.repository.CoastalStationHaiphongRepository;
import com.hanghai.kchtg.station.repository.CoastalStationInmarsatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class F159ReportHandlerTest {

    @Mock
    private CoastalStationHaiphongRepository coastalStationHaiphongRepository;

    @Mock
    private CoastalStationInmarsatRepository coastalStationInmarsatRepository;

    @Mock
    private OrgUnitRepository orgUnitRepository;

    @InjectMocks
    private F159ReportHandler handler;

    private UUID orgUnitId;

    @BeforeEach
    void setUp() {
        orgUnitId = UUID.randomUUID();
    }

    @Test
    void testSupports() {
        assertTrue(handler.supports("F-159"));
        assertTrue(handler.supports("f-159"));
    }

    @Test
    void testGetPreview_combinesStations() {
        CoastalStationHaiphong hp = new CoastalStationHaiphong();
        hp.setId(UUID.randomUUID());
        hp.setName("Đài TTDH Hải Phòng");
        hp.setLocationAddress("Hải Phòng");
        hp.setDescription("Toàn bộ vịnh Bắc Bộ");
        hp.setOrgUnitId(orgUnitId);
        hp.setCreatedAt(LocalDateTime.of(2024, 1, 1, 0, 0));

        CoastalStationInmarsat inm = new CoastalStationInmarsat();
        inm.setId(UUID.randomUUID());
        inm.setName("Đài Inmarsat LES Hải Phòng");
        inm.setLocationAddress("Hải Phòng");
        inm.setDescription("Khu vực Ấn Độ Dương và Thái Bình Dương");
        inm.setOrgUnitId(orgUnitId);
        inm.setCreatedAt(LocalDateTime.of(2024, 1, 1, 0, 0));

        when(coastalStationHaiphongRepository.findByDeletedAtIsNull()).thenReturn(List.of(hp));
        when(coastalStationInmarsatRepository.findByDeletedAtIsNull()).thenReturn(List.of(inm));

        ReportPreviewRequest request = new ReportPreviewRequest();
        request.setStartDate(LocalDate.of(2025, 1, 1));

        ReportResponse response = handler.getPreview(request);

        assertNotNull(response);
        assertEquals(2, response.getRows().size());
        assertEquals(1, response.getRows().get(0).get("STT"));
        assertEquals("Đài TTDH Hải Phòng", response.getRows().get(0).get("Tên đài thông tin duyên hải"));
        assertEquals(2, response.getRows().get(1).get("STT"));
        assertEquals("Đài Inmarsat LES Hải Phòng", response.getRows().get(1).get("Tên đài thông tin duyên hải"));
    }

    @Test
    void testExport_producesExportList() {
        CoastalStationHaiphong hp = new CoastalStationHaiphong();
        hp.setId(UUID.randomUUID());
        hp.setName("Đài TTDH Đà Nẵng");
        hp.setLocationAddress("Đà Nẵng");
        hp.setDescription("Vùng biển miền Trung");
        hp.setOrgUnitId(orgUnitId);
        hp.setCreatedAt(LocalDateTime.of(2024, 1, 1, 0, 0));

        when(coastalStationHaiphongRepository.findByDeletedAtIsNull()).thenReturn(List.of(hp));
        when(coastalStationInmarsatRepository.findByDeletedAtIsNull()).thenReturn(List.of());

        ReportPreviewRequest request = new ReportPreviewRequest();
        request.setStartDate(LocalDate.of(2025, 1, 1));

        List<Map<String, Object>> data = handler.getExportData(request, 2025);

        assertNotNull(data);
        assertEquals(1, data.size());
        assertEquals("Đài TTDH Đà Nẵng", data.get(0).get("ten"));
        assertEquals("Đà Nẵng", data.get(0).get("diaDiem"));
    }
}
