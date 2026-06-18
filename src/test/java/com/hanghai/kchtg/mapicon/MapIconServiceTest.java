package com.hanghai.kchtg.mapicon;

import com.hanghai.kchtg.mapicon.entity.MapIcon;
import com.hanghai.kchtg.mapicon.entity.MapIcon.Category;
import com.hanghai.kchtg.mapicon.entity.MapIcon.Status;
import com.hanghai.kchtg.mapicon.repository.MapIconRepository;
import com.hanghai.kchtg.mapicon.service.MapIconService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MapIconServiceTest {

    @Mock
    private MapIconRepository mapIconRepository;

    @InjectMocks
    private MapIconService mapIconService;

    private MapIcon testIcon = new MapIcon();

    @BeforeEach
    void setUp() {
        testIcon.setId(1L);
        testIcon.setName("Cảng biển");
        testIcon.setCode("PORT");
        testIcon.setIconType(Category.PORT);
        testIcon.setColor("#4a90d9");
        testIcon.setSize(32);
        testIcon.setStatus(IconStatus.ACTIVE);
    }

    // ==================== CRUD TESTS ====================

    @Test
    void createIcon_shouldReturnIcon() {
        var request = new com.hanghai.kchtg.mapicon.dto.CreateMapIconRequest();
        request.setName("Đèn biển");
        request.setCode("LIGHT");
        request.setIconType(Category.LIGHT);

        when(mapIconRepository.existsByCode("LIGHT")).thenReturn(false);
        when(mapIconRepository.save(any())).thenReturn(testIcon);

        MapIcon result = mapIconService.createIcon(request);

        assertNotNull(result);
        verify(mapIconRepository).save(any());
    }

    @Test
    void createIcon_shouldThrowWhenCodeExists() {
        var request = new com.hanghai.kchtg.mapicon.dto.CreateMapIconRequest();
        request.setName("Cảng");
        request.setCode("PORT");

        when(mapIconRepository.existsByCode("PORT")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> mapIconService.createIcon(request));
        verify(mapIconRepository, never()).save(any());
    }

    @Test
    void updateIcon_shouldChangeName() {
        MapIcon existing = new MapIcon(testIcon);
        existing.setName("Cảng biển");
        when(mapIconRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(mapIconRepository.save(any())).thenReturn(existing);

        mapIconService.updateIcon(1L, "Cảng biển lớn");

        assertEquals("Cảng biển lớn", existing.getName());
    }

    @Test
    void deleteIcon_shouldThrowIfReferenced() {
        when(mapIconRepository.findById(1L)).thenReturn(Optional.of(testIcon));
        when(mapIconRepository.countByIconId(any())).thenReturn(5L);

        assertThrows(RuntimeException.class, () -> mapIconService.deleteIcon(1L));
    }

    @Test
    void deleteIcon_shouldSoftDeleteWhenNotReferenced() {
        MapIcon existing = new MapIcon(testIcon);
        when(mapIconRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(mapIconRepository.countByIconId(any())).thenReturn(0L);
        when(mapIconRepository.save(any())).thenReturn(existing);

        mapIconService.deleteIcon(1L);

        assertNotNull(existing.getDeletedAt());
    }

    // ==================== SVG VALIDATION TESTS ====================

    @Test
    void validateSvg_shouldReturnTrueForValid() {
        assertTrue(mapIconService.validateSvg("<svg xmlns='http://www.w3.org/2000/svg'><rect width='32' height='32'/></svg>"));
    }

    @Test
    void validateSvg_shouldReturnFalseForInvalid() {
        assertFalse(mapIconService.validateSvg("<invalid"));
        assertFalse(mapIconService.validateSvg("not svg"));
        assertFalse(mapIconService.validateSvg(""));
        assertFalse(mapIconService.validateSvg(null));
    }

    // ==================== SEARCH TESTS ====================

    @Test
    void searchByName_shouldFindMatching() {
        when(mapIconRepository.searchByNameContaining("cảng", any(Pageable.class))).thenReturn(new PageImpl<>(List.of(testIcon)));

        Page<MapIcon> result = mapIconService.searchByName("cảng", PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void findByType_shouldReturnMatching() {
        when(mapIconRepository.findByIconType(Category.PORT, any(Pageable.class))).thenReturn(new PageImpl<>(List.of(testIcon)));

        Page<MapIcon> result = mapIconService.findByType(Category.PORT, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
    }

    // ==================== SLD TESTS ====================

    @Test
    void generateSLD_shouldIncludeColor() {
        String sld = mapIconService.generateSLD(testIcon);

        assertNotNull(sld);
        assertTrue(sld.contains("#4a90d9"));
    }
}
