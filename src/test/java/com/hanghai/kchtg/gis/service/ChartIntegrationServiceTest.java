package com.hanghai.kchtg.gis.service;

import com.hanghai.kchtg.gis.entity.ChartCell;
import com.hanghai.kchtg.gis.entity.ChartFeature;
import com.hanghai.kchtg.gis.entity.S63Permit;
import com.hanghai.kchtg.gis.layer.entity.MapLayer;
import com.hanghai.kchtg.gis.layer.repository.MapLayerRepository;
import com.hanghai.kchtg.gis.parser.S57Parser;
import com.hanghai.kchtg.gis.parser.S63Decryptor;
import com.hanghai.kchtg.gis.repository.ChartCellRepository;
import com.hanghai.kchtg.gis.repository.ChartFeatureRepository;
import com.hanghai.kchtg.gis.repository.S63PermitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChartIntegrationServiceTest {

    @Mock
    private ChartCellRepository cellRepository;
    @Mock
    private ChartFeatureRepository featureRepository;
    @Mock
    private S63PermitRepository permitRepository;
    @Mock
    private MapLayerRepository mapLayerRepository;
    @Mock
    private S57Parser s57Parser;
    @Mock
    private S63Decryptor s63Decryptor;
    @Mock
    private S52StyleService s52StyleService;

    @InjectMocks
    private ChartIntegrationService chartIntegrationService;

    private ChartCell testCell;
    private S63Permit testPermit;
    private ChartFeature testFeature;

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

        testFeature = ChartFeature.builder()
                .cellId(testCell.getId())
                .featureName("Phao báo hiệu số 1")
                .featureCode("BOYSPP")
                .geometryType(ChartFeature.GeometryType.POINT)
                .coordinates("POINT(106.6297 10.7769)")
                .attributesJson("{}")
                .build();
        testFeature.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Import S-57 cell successfully")
    void testImportS57Success() throws IOException {
        byte[] fileBytes = "MOCK-S57".getBytes();
        S57Parser.ParsedCellData parsedData = new S57Parser.ParsedCellData();
        parsedData.cellName = "VN412001";
        parsedData.producer = "VMS-N";
        parsedData.scale = 25000;
        parsedData.features.add(testFeature);

        when(s57Parser.parse(any(), any())).thenReturn(parsedData);
        when(cellRepository.findByCellName(any())).thenReturn(Optional.empty());
        when(cellRepository.save(any(ChartCell.class))).thenReturn(testCell);
        when(featureRepository.findByCellId(any())).thenReturn(Collections.emptyList());
        when(mapLayerRepository.findByCode(any())).thenReturn(Optional.empty());

        ChartCell result = chartIntegrationService.importS57(fileBytes, "VN412001.000");

        assertNotNull(result);
        assertEquals("VN412001", result.getCellName());
        assertFalse(result.getIsEncrypted());
        verify(cellRepository, times(1)).save(any());
        verify(featureRepository, times(1)).save(any());
        verify(mapLayerRepository, times(1)).save(any(MapLayer.class));
    }

    @Test
    @DisplayName("Import S-63 cell successfully after decryption")
    void testImportS63Success() throws IOException {
        byte[] fileBytes = "MOCK-S63-ENCRYPTED".getBytes();
        byte[] decryptedBytes = "MOCK-S57".getBytes();
        
        S57Parser.ParsedCellData parsedData = new S57Parser.ParsedCellData();
        parsedData.cellName = "VN412001";
        parsedData.features.add(testFeature);

        when(permitRepository.findByCellName("VN412001")).thenReturn(Optional.of(testPermit));
        when(s63Decryptor.decrypt(fileBytes, testPermit)).thenReturn(decryptedBytes);
        when(s57Parser.parse(decryptedBytes, "VN412001.000")).thenReturn(parsedData);
        when(cellRepository.findByCellName("VN412001")).thenReturn(Optional.empty());
        when(cellRepository.save(any(ChartCell.class))).thenAnswer(invocation -> {
            ChartCell c = invocation.getArgument(0);
            c.setId(testCell.getId());
            return c;
        });
        when(mapLayerRepository.findByCode(any())).thenReturn(Optional.empty());

        ChartCell result = chartIntegrationService.importS63(fileBytes, "VN412001.000");

        assertNotNull(result);
        assertTrue(result.getIsEncrypted());
        verify(permitRepository, times(1)).findByCellName("VN412001");
        verify(s63Decryptor, times(1)).decrypt(any(), any());
        verify(cellRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Import S-63 throws exception when permit not found")
    void testImportS63PermitNotFound() {
        byte[] fileBytes = "MOCK-S63-ENCRYPTED".getBytes();
        when(permitRepository.findByCellName("VN412001")).thenReturn(Optional.empty());

        assertThrows(IOException.class, () -> 
            chartIntegrationService.importS63(fileBytes, "VN412001.000")
        );
    }

    @Test
    @DisplayName("Register permit saves successfully")
    void testRegisterPermit() {
        when(permitRepository.findByCellName("VN412001")).thenReturn(Optional.empty());
        when(permitRepository.save(any())).thenReturn(testPermit);

        S63Permit result = chartIntegrationService.registerPermit("VN412001", "KEY123", "2026-12-31");

        assertNotNull(result);
        verify(permitRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Get S-52 Styled features maps features with styles")
    void testGetS52StyledFeatures() {
        when(featureRepository.findByCellId(testCell.getId())).thenReturn(Collections.singletonList(testFeature));
        
        S52StyleService.S52Style style = new S52StyleService.S52Style();
        style.fillColor = "#ffff00";
        style.strokeColor = "#ffff00";
        style.strokeWidth = 2;
        style.iconSymbol = "special-buoy";
        
        when(s52StyleService.getStyle(any(), any())).thenReturn(style);

        List<Map<String, Object>> result = chartIntegrationService.getS52StyledFeatures(testCell.getId(), "DAY");

        assertNotNull(result);
        assertEquals(1, result.size());
        Map<String, Object> featureMap = result.get(0);
        assertEquals("BOYSPP", featureMap.get("featureCode"));
        
        Map<String, Object> styleMap = (Map<String, Object>) featureMap.get("s52Style");
        assertEquals("#ffff00", styleMap.get("fillColor"));
        assertEquals("special-buoy", styleMap.get("iconSymbol"));
    }
}
