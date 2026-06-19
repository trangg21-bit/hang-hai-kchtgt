package com.hanghai.kchtg.report;

import com.hanghai.kchtg.gis.layer.repository.MapLayerRepository;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.service.ReportService;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@DisplayName("ReportService Unit Tests")
public class ReportServiceTest {

    private PointObjectRepository pointObjectRepository;
    private LineObjectRepository lineObjectRepository;
    private PolygonObjectRepository polygonObjectRepository;
    private MapLayerRepository mapLayerRepository;
    private UserRepository userRepository;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        pointObjectRepository = Mockito.mock(PointObjectRepository.class);
        lineObjectRepository = Mockito.mock(LineObjectRepository.class);
        polygonObjectRepository = Mockito.mock(PolygonObjectRepository.class);
        mapLayerRepository = Mockito.mock(MapLayerRepository.class);
        userRepository = Mockito.mock(UserRepository.class);

        reportService = new ReportService(
                pointObjectRepository,
                lineObjectRepository,
                polygonObjectRepository,
                mapLayerRepository,
                userRepository
        );
    }

    @Nested
    @DisplayName("F-141 Report Generation (Báo cáo tăng giảm tài sản)")
    class F141Report {

        @Test
        @DisplayName("Should generate preview correctly with filtered items")
        void shouldGenerateF141Preview() {
            PointObject p1 = new PointObject();
            p1.setCode("PT-001");
            p1.setName("Phao tiêu số 1");
            p1.setCreatedAt(LocalDateTime.now());

            when(pointObjectRepository.findAll()).thenReturn(Collections.singletonList(p1));

            ReportRequest request = ReportRequest.builder()
                    .reportCode("F-141")
                    .format("PREVIEW")
                    .build();

            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-141", response.getReportCode());
            assertEquals("Báo cáo tăng giảm tài sản", response.getReportName());
            assertTrue(response.getHeaders().contains("Tên tài sản"));
            assertEquals(1, response.getRows().size());
            assertEquals("Phao tiêu số 1", response.getRows().get(0).get("Tên tài sản"));
        }
    }

    @Nested
    @DisplayName("F-180 Report Generation (Biểu tổng hợp thông tin chung)")
    class F180Report {

        @Test
        @DisplayName("Should count and group all items correctly")
        void shouldGenerateF180Preview() {
            when(pointObjectRepository.count()).thenReturn(10L);
            when(lineObjectRepository.count()).thenReturn(5L);
            when(polygonObjectRepository.count()).thenReturn(2L);
            when(mapLayerRepository.count()).thenReturn(4L);
            when(userRepository.count()).thenReturn(15L);

            ReportRequest request = ReportRequest.builder()
                    .reportCode("F-180")
                    .format("PREVIEW")
                    .build();

            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-180", response.getReportCode());
            assertEquals(5, response.getRows().size());
            assertEquals(10L, response.getRows().get(0).get("Số lượng"));
        }
    }

    @Nested
    @DisplayName("F-151 Report Generation (Thống kê luồng hàng hải)")
    class F151Report {

        @Test
        @DisplayName("Should map and list all line objects")
        void shouldGenerateF151Preview() {
            LineObject l1 = new LineObject();
            l1.setCode("L-001");
            l1.setName("Luồng hàng hải Hải Phòng");
            l1.setCoordinates("LINESTRING (106.8 20.8, 107.0 20.9)");
            l1.setUpdatedAt(LocalDateTime.now());

            when(lineObjectRepository.findAll()).thenReturn(Collections.singletonList(l1));

            ReportRequest request = ReportRequest.builder()
                    .reportCode("F-151")
                    .format("PREVIEW")
                    .build();

            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-151", response.getReportCode());
            assertEquals(1, response.getRows().size());
            assertEquals("Luồng hàng hải Hải Phòng", response.getRows().get(0).get("Tên tuyến luồng"));
        }
    }

    @Nested
    @DisplayName("Export Report Utility")
    class ExportReport {

        @Test
        @DisplayName("Should generate CSV bytes correctly with UTF-8 BOM")
        void shouldExportReportAsExcel() {
            when(pointObjectRepository.findAll()).thenReturn(Collections.emptyList());

            ReportRequest request = ReportRequest.builder()
                    .reportCode("F-141")
                    .format("EXCEL")
                    .build();

            byte[] excelBytes = reportService.exportReport(request);
            assertNotNull(excelBytes);
            assertTrue(excelBytes.length > 0);
            
            String content = new String(excelBytes, java.nio.charset.StandardCharsets.UTF_8);
            // Verify UTF-8 BOM is present
            assertTrue(content.startsWith("\uFEFF"));
            assertTrue(content.contains("Báo cáo tăng giảm tài sản".toUpperCase()));
        }
    }
}
