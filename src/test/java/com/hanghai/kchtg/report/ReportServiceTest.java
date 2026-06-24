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
import java.util.Arrays;

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
    @DisplayName("F-142 Report Generation (Thông tin tài chính tài sản)")
    class F142Report {
        @Test
        @DisplayName("Should generate financial fields correctly")
        void shouldGenerateF142Preview() {
            PointObject p1 = new PointObject();
            p1.setCode("PT-001");
            p1.setName("Phao tiêu số 1");
            when(pointObjectRepository.findAll()).thenReturn(Collections.singletonList(p1));

            ReportRequest request = ReportRequest.builder().reportCode("F-142").format("PREVIEW").build();
            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-142", response.getReportCode());
            assertTrue(response.getHeaders().contains("Nguyên giá (VNĐ)"));
            assertEquals(1, response.getRows().size());
            assertNotNull(response.getSummary().get("Tổng nguyên giá tài sản"));
        }
    }

    @Nested
    @DisplayName("F-143 Report Generation (Kê khai tài sản)")
    class F143Report {
        @Test
        @DisplayName("Should map tech specifications")
        void shouldGenerateF143Preview() {
            PointObject p1 = new PointObject();
            p1.setCode("PT-001");
            p1.setName("Phao tiêu số 1");
            when(pointObjectRepository.findAll()).thenReturn(Collections.singletonList(p1));

            ReportRequest request = ReportRequest.builder().reportCode("F-143").format("PREVIEW").build();
            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-143", response.getReportCode());
            assertTrue(response.getHeaders().contains("Thông số kỹ thuật"));
            assertEquals(1, response.getRows().size());
        }
    }

    @Nested
    @DisplayName("F-144 Report Generation (Tình hình quản lý tài sản)")
    class F144Report {
        @Test
        @DisplayName("Should count and group managed assets")
        void shouldGenerateF144Preview() {
            when(pointObjectRepository.count()).thenReturn(5L);
            when(lineObjectRepository.count()).thenReturn(3L);
            when(polygonObjectRepository.count()).thenReturn(1L);

            ReportRequest request = ReportRequest.builder().reportCode("F-144").format("PREVIEW").build();
            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-144", response.getReportCode());
            assertEquals(3, response.getRows().size());
            assertEquals(5L, response.getRows().get(0).get("Tổng số lượng"));
        }
    }

    @Nested
    @DisplayName("F-145 Report Generation (Tình hình xử lý tài sản)")
    class F145Report {
        @Test
        @DisplayName("Should list draft status as processed assets")
        void shouldGenerateF145Preview() {
            PointObject p1 = new PointObject();
            p1.setCode("PT-001");
            p1.setName("Phao tiêu số 1");
            p1.setStatus(PointObject.Status.DRAFT);
            when(pointObjectRepository.findAll()).thenReturn(Collections.singletonList(p1));

            ReportRequest request = ReportRequest.builder().reportCode("F-145").format("PREVIEW").build();
            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-145", response.getReportCode());
            assertEquals(1, response.getRows().size());
            assertEquals("Thanh lý thu hồi", response.getRows().get(0).get("Hình thức xử lý"));
        }
    }

    @Nested
    @DisplayName("F-146 Report Generation (Tình hình khai thác tài sản)")
    class F146Report {
        @Test
        @DisplayName("Should list ports leasing revenue")
        void shouldGenerateF146Preview() {
            PointObject p1 = new PointObject();
            p1.setCode("PORT-001");
            p1.setName("Cảng Hải Phòng");
            p1.setObjectType(PointObject.ObjectType.PORT);
            when(pointObjectRepository.findAll()).thenReturn(Collections.singletonList(p1));

            ReportRequest request = ReportRequest.builder().reportCode("F-146").format("PREVIEW").build();
            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-146", response.getReportCode());
            assertEquals(1, response.getRows().size());
        }
    }

    @Nested
    @DisplayName("F-147 Report Generation (Tài sản đề nghị xử lý)")
    class F147Report {
        @Test
        @DisplayName("Should list pending approval status as proposed assets")
        void shouldGenerateF147Preview() {
            PointObject p1 = new PointObject();
            p1.setCode("PT-001");
            p1.setName("Phao tiêu số 1");
            p1.setStatus(PointObject.Status.PENDING_APPROVAL);
            when(pointObjectRepository.findAll()).thenReturn(Collections.singletonList(p1));

            ReportRequest request = ReportRequest.builder().reportCode("F-147").format("PREVIEW").build();
            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-147", response.getReportCode());
            assertEquals(1, response.getRows().size());
            assertEquals("Thanh lý và nâng cấp mới", response.getRows().get(0).get("Hình thức đề nghị"));
        }
    }

    @Nested
    @DisplayName("F-181 Report Generation (Tổng hợp hạ tầng hàng hải)")
    class F181Report {
        @Test
        @DisplayName("Should return structured infrastructure overview")
        void shouldGenerateF181Preview() {
            when(pointObjectRepository.count()).thenReturn(10L);
            when(lineObjectRepository.count()).thenReturn(5L);
            when(polygonObjectRepository.count()).thenReturn(2L);

            ReportRequest request = ReportRequest.builder().reportCode("F-181").format("PREVIEW").build();
            ReportResponse response = reportService.generateReportPreview(request);

            assertNotNull(response);
            assertEquals("F-181", response.getReportCode());
            assertEquals(3, response.getRows().size());
            assertEquals(10L, response.getRows().get(0).get("Số lượng ghi nhận"));
        }
    }

    @Nested
    @DisplayName("Wave 2 Reports Generation")
    class Wave2Reports {
        @Test
        @DisplayName("Should generate Wave 2 report previews successfully")
        void shouldGenerateWave2Previews() {
            PointObject p1 = new PointObject();
            p1.setCode("PORT-01");
            p1.setName("Cảng Hải Phòng");
            p1.setObjectType(PointObject.ObjectType.PORT);
            p1.setStatus(PointObject.Status.PUBLISHED);

            PointObject b1 = new PointObject();
            b1.setCode("BUOY-01");
            b1.setName("Phao số 1");
            b1.setObjectType(PointObject.ObjectType.BUOY);
            b1.setStatus(PointObject.Status.PUBLISHED);

            PointObject lh1 = new PointObject();
            lh1.setCode("LH-01");
            lh1.setName("Hải đăng Hòn Dấu");
            lh1.setObjectType(PointObject.ObjectType.LIGHTHOUSE);

            when(pointObjectRepository.findAll()).thenReturn(Arrays.asList(p1, b1, lh1));

            com.hanghai.kchtg.gis.polygon.entity.PolygonObject poly = new com.hanghai.kchtg.gis.polygon.entity.PolygonObject();
            poly.setName("Vùng neo đậu A");
            poly.setCoordinates("POLYGON ((106.8 20.8, 107.0 20.8, 107.0 20.9, 106.8 20.8))");
            when(polygonObjectRepository.findAll()).thenReturn(Collections.singletonList(poly));

            LineObject line = new LineObject();
            line.setName("Kè bảo vệ số 1");
            when(lineObjectRepository.findAll()).thenReturn(Collections.singletonList(line));

            String[] codes = {"F-148", "F-149", "F-150", "F-152", "F-153", "F-154", "F-155", "F-156", "F-157", "F-158", "F-159", "F-160"};
            for (String code : codes) {
                ReportRequest request = ReportRequest.builder().reportCode(code).format("PREVIEW").build();
                ReportResponse response = reportService.generateReportPreview(request);
                assertNotNull(response, "Response should not be null for " + code);
                assertEquals(code, response.getReportCode());
                assertFalse(response.getHeaders().isEmpty(), "Headers should not be empty for " + code);
            }
        }
    }

    @Nested
    @DisplayName("Wave 3 Reports Generation")
    class Wave3Reports {
        @Test
        @DisplayName("Should generate Wave 3 report previews successfully")
        void shouldGenerateWave3Previews() {
            PointObject p1 = new PointObject();
            p1.setCode("PORT-01");
            p1.setName("Cảng Hải Phòng");
            p1.setObjectType(PointObject.ObjectType.PORT);
            when(pointObjectRepository.findAll()).thenReturn(Collections.singletonList(p1));

            String[] codes = {"F-161", "F-162", "F-163", "F-164", "F-167", "F-171", "F-172", "F-173"};
            for (String code : codes) {
                ReportRequest request = ReportRequest.builder().reportCode(code).format("PREVIEW").build();
                ReportResponse response = reportService.generateReportPreview(request);
                assertNotNull(response, "Response should not be null for " + code);
                assertEquals(code, response.getReportCode());
                assertFalse(response.getHeaders().isEmpty(), "Headers should not be empty for " + code);
                assertFalse(response.getRows().isEmpty(), "Rows should not be empty for " + code);
            }
        }
    }

    @Nested
    @DisplayName("Wave 4 Reports Generation")
    class Wave4Reports {
        @Test
        @DisplayName("Should generate Wave 4 report previews successfully")
        void shouldGenerateWave4Previews() {
            PointObject p1 = new PointObject();
            p1.setCode("PORT-01");
            p1.setName("Cảng Hải Phòng");
            p1.setObjectType(PointObject.ObjectType.PORT);
            when(pointObjectRepository.findAll()).thenReturn(Collections.singletonList(p1));

            String[] codes = {"F-165", "F-166", "F-168", "F-169", "F-174", "F-177", "F-178"};
            for (String code : codes) {
                ReportRequest request = ReportRequest.builder().reportCode(code).format("PREVIEW").build();
                ReportResponse response = reportService.generateReportPreview(request);
                assertNotNull(response, "Response should not be null for " + code);
                assertEquals(code, response.getReportCode());
                assertFalse(response.getHeaders().isEmpty(), "Headers should not be empty for " + code);
                assertFalse(response.getRows().isEmpty(), "Rows should not be empty for " + code);
            }
        }
    }

    @Nested
    @DisplayName("Wave 5 Reports Generation")
    class Wave5Reports {
        @Test
        @DisplayName("Should generate Wave 5 report previews successfully")
        void shouldGenerateWave5Previews() {
            PointObject p1 = new PointObject();
            p1.setCode("PORT-01");
            p1.setName("Cảng Hải Phòng");
            p1.setObjectType(PointObject.ObjectType.PORT);
            when(pointObjectRepository.findAll()).thenReturn(Collections.singletonList(p1));

            String[] codes = {"F-170", "F-175", "F-176", "F-179"};
            for (String code : codes) {
                ReportRequest request = ReportRequest.builder().reportCode(code).format("PREVIEW").build();
                ReportResponse response = reportService.generateReportPreview(request);
                assertNotNull(response, "Response should not be null for " + code);
                assertEquals(code, response.getReportCode());
                assertFalse(response.getHeaders().isEmpty(), "Headers should not be empty for " + code);
                assertFalse(response.getRows().isEmpty(), "Rows should not be empty for " + code);
            }
        }
    }

    @Nested
    @DisplayName("Wave 6 Reports Generation")
    class Wave6Reports {
        @Test
        @DisplayName("Should generate Wave 6 report previews successfully")
        void shouldGenerateWave6Previews() {
            PointObject p1 = new PointObject();
            p1.setCode("PORT-01");
            p1.setName("Cảng Hải Phòng");
            p1.setObjectType(PointObject.ObjectType.PORT);

            PointObject b1 = new PointObject();
            b1.setCode("BUOY-01");
            b1.setName("Phao số 1");
            b1.setObjectType(PointObject.ObjectType.BUOY);

            PointObject lh1 = new PointObject();
            lh1.setCode("LH-01");
            lh1.setName("Hải đăng Hòn Dấu");
            lh1.setObjectType(PointObject.ObjectType.LIGHTHOUSE);

            when(pointObjectRepository.findAll()).thenReturn(Arrays.asList(p1, b1, lh1));

            LineObject line = new LineObject();
            line.setName("Kè bảo vệ số 1");
            when(lineObjectRepository.findAll()).thenReturn(Collections.singletonList(line));

            String[] codes = {"F-182", "F-183", "F-184", "F-185", "F-186", "F-187", "F-188", "F-189"};
            for (String code : codes) {
                ReportRequest request = ReportRequest.builder().reportCode(code).format("PREVIEW").build();
                ReportResponse response = reportService.generateReportPreview(request);
                assertNotNull(response, "Response should not be null for " + code);
                assertEquals(code, response.getReportCode());
                assertFalse(response.getHeaders().isEmpty(), "Headers should not be empty for " + code);
                assertFalse(response.getRows().isEmpty(), "Rows should not be empty for " + code);
            }
        }
    }

    @Nested
    @DisplayName("Export Report Utility")
    class ExportReport {

        @Test
        @DisplayName("Should generate Excel bytes correctly in XLSX format")
        void shouldExportReportAsExcel() {
            when(pointObjectRepository.findAll()).thenReturn(Collections.emptyList());

            ReportRequest request = ReportRequest.builder()
                    .reportCode("F-141")
                    .format("EXCEL")
                    .build();

            byte[] excelBytes = reportService.exportReport(request);
            assertNotNull(excelBytes);
            assertTrue(excelBytes.length > 0);
            
            // Verify XLSX ZIP file signature (starts with 'P' 'K' -> 0x50, 0x4B)
            assertEquals((byte) 0x50, excelBytes[0]);
            assertEquals((byte) 0x4B, excelBytes[1]);
        }
    }
}