package com.hanghai.kchtg.report;

import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.ChannelRouteDetailRepository;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.handler.F156ReportHandler;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
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
class F156ReportHandlerTest {

    @Mock
    private NavigationChannelRepository navigationChannelRepository;

    @Mock
    private ChannelRouteDetailRepository channelRouteDetailRepository;

    @Mock
    private BuoyRepository buoyRepository;

    @Mock
    private BuoyStationRepository buoyStationRepository;

    @Mock
    private OrgUnitRepository orgUnitRepository;

    @InjectMocks
    private F156ReportHandler handler;

    private UUID orgUnitId;
    private UUID channelId;

    @BeforeEach
    void setUp() {
        orgUnitId = UUID.randomUUID();
        channelId = UUID.randomUUID();
    }

    @Test
    void testSupports() {
        assertTrue(handler.supports("F-156"));
        assertTrue(handler.supports("f-156"));
    }

    @Test
    void testGetPreview_hierarchicalRows() {
        NavigationChannel nc = NavigationChannel.builder()
                .id(channelId)
                .channelName("Luồng Hải Phòng")
                .orgUnitId(orgUnitId)
                .createdAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .build();

        ChannelRouteDetail route = ChannelRouteDetail.builder()
                .navigationChannel(nc)
                .routeName("Đoạn Lạch Huyện")
                .routeCode("LH-01")
                .channelLengthKilometers(new BigDecimal("12.5"))
                .build();
        route.setId(UUID.randomUUID());

        Buoy b1 = Buoy.builder()
                .name("Phao số 0")
                .code("P0")
                .type("PHAO")
                .color("Xanh")
                .orgUnitId(orgUnitId)
                .locationDetail("Luồng Hải Phòng")
                .build();
        b1.setId(UUID.randomUUID());
        b1.setCreatedAt(LocalDateTime.of(2024, 1, 1, 0, 0));

        Buoy b2 = Buoy.builder()
                .name("Tiêu số 1")
                .code("T1")
                .type("TIEU")
                .orgUnitId(orgUnitId)
                .locationDetail("Luồng Hải Phòng")
                .build();
        b2.setId(UUID.randomUUID());
        b2.setCreatedAt(LocalDateTime.of(2024, 1, 1, 0, 0));

        when(navigationChannelRepository.findByDeletedAtIsNull(any(Sort.class))).thenReturn(List.of(nc));
        when(channelRouteDetailRepository.findByNavigationChannelIdOrderBySequenceNoAsc(channelId)).thenReturn(List.of(route));
        when(buoyRepository.findAll()).thenReturn(List.of(b1, b2));
        when(buoyStationRepository.findAll()).thenReturn(List.of());

        ReportPreviewRequest request = new ReportPreviewRequest();
        request.setStartDate(LocalDate.of(2025, 1, 1));

        ReportResponse response = handler.getPreview(request);

        assertNotNull(response);
        // 1 parent row + 1 child row = 2 rows
        assertEquals(2, response.getRows().size());
        assertEquals("1", response.getRows().get(0).get("STT"));
        assertEquals("Luồng Hải Phòng", response.getRows().get(0).get("Danh mục luồng, tuyến luồng hàng hải"));
        assertEquals("", response.getRows().get(1).get("STT"));
        assertTrue(response.getRows().get(1).get("Danh mục luồng, tuyến luồng hàng hải").toString().contains("Đoạn Lạch Huyện"));
    }

    @Test
    void testExport_producesExportList() {
        NavigationChannel nc = NavigationChannel.builder()
                .id(channelId)
                .channelName("Luồng Sài Gòn")
                .orgUnitId(orgUnitId)
                .createdAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .build();

        when(navigationChannelRepository.findByDeletedAtIsNull(any(Sort.class))).thenReturn(List.of(nc));
        when(channelRouteDetailRepository.findByNavigationChannelIdOrderBySequenceNoAsc(channelId)).thenReturn(List.of());
        when(buoyRepository.findAll()).thenReturn(List.of());
        when(buoyStationRepository.findAll()).thenReturn(List.of());

        ReportPreviewRequest request = new ReportPreviewRequest();
        request.setStartDate(LocalDate.of(2025, 1, 1));

        List<Map<String, Object>> data = handler.getExportData(request, 2025);

        assertNotNull(data);
        assertEquals(1, data.size());
        assertEquals("Luồng Sài Gòn", data.get(0).get("ten"));
    }
}
