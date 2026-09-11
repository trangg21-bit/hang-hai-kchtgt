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
import com.hanghai.kchtg.report.handler.F157ReportHandler;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
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
class F157ReportHandlerTest {

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
    private F157ReportHandler handler;

    private UUID orgUnitId;
    private UUID channelId;

    @BeforeEach
    void setUp() {
        orgUnitId = UUID.randomUUID();
        channelId = UUID.randomUUID();
    }

    @Test
    void testSupports() {
        assertTrue(handler.supports("F-157"));
        assertTrue(handler.supports("f-157"));
    }

    @Test
    void testGetPreview_detailRows() {
        NavigationChannel nc = NavigationChannel.builder()
                .id(channelId)
                .channelName("Luồng Đà Nẵng")
                .orgUnitId(orgUnitId)
                .createdAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .build();

        ChannelRouteDetail route = ChannelRouteDetail.builder()
                .navigationChannel(nc)
                .routeName("Đoạn Tiên Sa")
                .routeCode("TS-01")
                .build();
        route.setId(UUID.randomUUID());

        Buoy buoy = Buoy.builder()
                .name("Phao số 0")
                .code("P0")
                .type("PHAO")
                .color("Đỏ")
                .orgUnitId(orgUnitId)
                .locationDetail("Đoạn Tiên Sa")
                .build();
        buoy.setId(UUID.randomUUID());
        buoy.setCreatedAt(LocalDateTime.of(2024, 1, 1, 0, 0));

        when(navigationChannelRepository.findByDeletedAtIsNull(any(Sort.class))).thenReturn(List.of(nc));
        when(channelRouteDetailRepository.findByNavigationChannelIdOrderBySequenceNoAsc(channelId)).thenReturn(List.of(route));
        when(buoyRepository.findAll()).thenReturn(List.of(buoy));
        when(buoyStationRepository.findAll()).thenReturn(List.of());

        ReportPreviewRequest request = new ReportPreviewRequest();
        request.setStartDate(LocalDate.of(2025, 1, 1));

        ReportResponse response = handler.getPreview(request);

        assertNotNull(response);
        // 1 parent channel row + 1 route row + 1 buoy detail row = 3 rows
        assertEquals(3, response.getRows().size());
        assertEquals("1", response.getRows().get(0).get("STT"));
        assertEquals("Luồng Đà Nẵng", response.getRows().get(0).get("Tên phao tiêu"));
        assertEquals("A", response.getRows().get(1).get("STT"));
        assertEquals("Phao số 0", response.getRows().get(2).get("Tên phao tiêu"));
    }

    @Test
    void testExport_producesExportList() {
        NavigationChannel nc = NavigationChannel.builder()
                .id(channelId)
                .channelName("Luồng Quy Nhơn")
                .orgUnitId(orgUnitId)
                .createdAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .build();

        Buoy buoy = Buoy.builder()
                .name("Phao số 1")
                .code("P1")
                .type("PHAO")
                .orgUnitId(orgUnitId)
                .locationDetail("Luồng Quy Nhơn")
                .build();
        buoy.setId(UUID.randomUUID());
        buoy.setCreatedAt(LocalDateTime.of(2024, 1, 1, 0, 0));

        when(navigationChannelRepository.findByDeletedAtIsNull(any(Sort.class))).thenReturn(List.of(nc));
        when(channelRouteDetailRepository.findByNavigationChannelIdOrderBySequenceNoAsc(channelId)).thenReturn(List.of());
        when(buoyRepository.findAll()).thenReturn(List.of(buoy));
        when(buoyStationRepository.findAll()).thenReturn(List.of());

        ReportPreviewRequest request = new ReportPreviewRequest();
        request.setStartDate(LocalDate.of(2025, 1, 1));

        List<Map<String, Object>> data = handler.getExportData(request, 2025);

        assertNotNull(data);
        assertEquals(1, data.size());
        assertEquals("Luồng Quy Nhơn", data.get(0).get("fkLuongHh"));
        assertEquals("Phao số 1", data.get(0).get("ten"));
    }
}
