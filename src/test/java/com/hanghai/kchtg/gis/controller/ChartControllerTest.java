package com.hanghai.kchtg.gis.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.entity.ChartCell;
import com.hanghai.kchtg.gis.entity.S63Permit;
import com.hanghai.kchtg.gis.service.ChartIntegrationService;
import com.hanghai.kchtg.gis.service.CoordinateCalibrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChartControllerTest {

    @Mock
    private ChartIntegrationService chartIntegrationService;
    @Mock
    private CoordinateCalibrationService coordinateCalibrationService;

    @InjectMocks
    private ChartController chartController;

    private ChartCell testCell;
    private S63Permit testPermit;

    @BeforeEach
    void setUp() {
        testCell = ChartCell.builder()
                .cellName("VN412001")
                .producer("VMS-N")
                .edition(1)
                .scale(25000)
                .updateNumber(0)
                .releaseDate(LocalDate.now())
                .isEncrypted(false)
                .status(ChartCell.Status.ACTIVE)
                .build();
        testCell.setId(UUID.randomUUID());

        testPermit = S63Permit.builder()
                .cellName("VN412001")
                .permitKey("A1B2C3D4E5F67890")
                .expiryDate(LocalDate.now().plusDays(30))
                .active(true)
                .build();
        testPermit.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("importS57 imports file successfully")
    void testImportS57Success() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getBytes()).thenReturn("MOCK-S57".getBytes());
        when(file.getOriginalFilename()).thenReturn("VN412001.000");

        when(chartIntegrationService.importS57(any(), any())).thenReturn(testCell);

        ResponseEntity<ApiResponse<ChartCell>> response = chartController.importS57(file);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("VN412001", response.getBody().getData().getCellName());
    }

    @Test
    @DisplayName("importS57 returns bad request on empty file")
    void testImportS57EmptyFile() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);

        ResponseEntity<ApiResponse<ChartCell>> response = chartController.importS57(file);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNull(response.getBody().getData());
    }

    @Test
    @DisplayName("importS63 imports file successfully")
    void testImportS63Success() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getBytes()).thenReturn("MOCK-S63-ENCRYPTED".getBytes());
        when(file.getOriginalFilename()).thenReturn("VN412001.000");

        testCell.setIsEncrypted(true);
        when(chartIntegrationService.importS63(any(), any())).thenReturn(testCell);

        ResponseEntity<ApiResponse<ChartCell>> response = chartController.importS63(file);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().getData().getIsEncrypted());
    }

    @Test
    @DisplayName("getAllCells returns list of cells")
    void testGetAllCells() {
        when(chartIntegrationService.getAllCells()).thenReturn(Collections.singletonList(testCell));

        ResponseEntity<ApiResponse<List<ChartCell>>> response = chartController.getAllCells();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("VN412001", response.getBody().getData().get(0).getCellName());
    }

    @Test
    @DisplayName("registerPermit registers permit successfully")
    void testRegisterPermit() {
        ChartController.PermitRequest request = new ChartController.PermitRequest();
        request.setCellName("VN412001");
        request.setPermitKey("KEY123");
        request.setExpiryDate("2026-12-31");

        when(chartIntegrationService.registerPermit(anyString(), anyString(), anyString())).thenReturn(testPermit);

        ResponseEntity<ApiResponse<S63Permit>> response = chartController.registerPermit(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("VN412001", response.getBody().getData().getCellName());
    }

    @Test
    @DisplayName("calibrate coordinates successfully")
    void testCalibrateSuccess() {
        ChartController.CalibrationRequest request = new ChartController.CalibrationRequest();
        request.setSystemType("VN2000");
        request.setCoord1("568390");
        request.setCoord2("2322890");
        request.setZoneOrCm("105.0");

        CoordinateCalibrationService.CoordinateResult result = new CoordinateCalibrationService.CoordinateResult();
        result.valid = true;
        result.longitude = 105.6297;
        result.latitude = 10.7769;

        when(coordinateCalibrationService.calibrate(anyString(), anyString(), anyString(), nullable(String.class), anyDouble(), anyDouble()))
                .thenReturn(result);

        ResponseEntity<ApiResponse<CoordinateCalibrationService.CoordinateResult>> response = chartController.calibrate(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().getData().valid);
        assertEquals(105.6297, response.getBody().getData().longitude);
    }

    @Test
    @DisplayName("calibrate returns bad request on invalid coordinate")
    void testCalibrateFailure() {
        ChartController.CalibrationRequest request = new ChartController.CalibrationRequest();
        request.setSystemType("WGS84");
        request.setCoord1("185.0");
        request.setCoord2("10.0");

        CoordinateCalibrationService.CoordinateResult result = new CoordinateCalibrationService.CoordinateResult();
        result.valid = false;
        result.errorMessage = "Kinh độ vượt quá phạm vi hợp lệ";

        when(coordinateCalibrationService.calibrate(anyString(), anyString(), anyString(), nullable(String.class), anyDouble(), anyDouble()))
                .thenReturn(result);

        ResponseEntity<ApiResponse<CoordinateCalibrationService.CoordinateResult>> response = chartController.calibrate(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNull(response.getBody().getData());
        assertNotNull(response.getBody().getMessage());
    }
}
