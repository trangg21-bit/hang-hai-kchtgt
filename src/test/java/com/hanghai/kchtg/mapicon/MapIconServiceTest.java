package com.hanghai.kchtg.mapicon;

import com.hanghai.kchtg.mapicon.dto.CreateMapIconRequest;
import com.hanghai.kchtg.mapicon.dto.MapIconResponse;
import com.hanghai.kchtg.mapicon.dto.UpdateMapIconRequest;
import com.hanghai.kchtg.mapicon.entity.MapIcon;
import com.hanghai.kchtg.mapicon.entity.MapIcon.Category;
import com.hanghai.kchtg.mapicon.entity.MapIcon.Status;
import com.hanghai.kchtg.mapicon.repository.MapIconRepository;
import com.hanghai.kchtg.mapicon.service.MapIconService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

    private MapIcon testIcon;
    private UUID testIconId;

    @BeforeEach
    void setUp() {
        testIconId = UUID.randomUUID();
        testIcon = new MapIcon();
        testIcon.setId(testIconId);
        testIcon.setName("Cảng biển");
        testIcon.setCode("PORT");
        testIcon.setCategory(Category.WHARF);
        testIcon.setIconUrl("http://localhost:8080/icons/port.svg");
        testIcon.setSize("32");
        testIcon.setStatus(Status.ACTIVE);
    }

    @Nested
    @DisplayName("Create MapIcon")
    class CreateTests {

        @Test
        @DisplayName("Should create map icon successfully")
        void createIcon_success() {
            CreateMapIconRequest request = new CreateMapIconRequest();
            request.setName("Đèn biển");
            request.setCode("LIGHT");
            request.setCategory(Category.LIGHTHOUSE);
            request.setIconUrl("http://localhost:8080/icons/lighthouse.svg");
            request.setSize("32");
            request.setStatus(Status.ACTIVE);

            when(mapIconRepository.existsByCode("LIGHT")).thenReturn(false);
            when(mapIconRepository.save(any(MapIcon.class))).thenReturn(testIcon);

            MapIconResponse result = mapIconService.create(request);

            assertNotNull(result);
            verify(mapIconRepository).save(any(MapIcon.class));
        }

        @Test
        @DisplayName("Should throw when map icon code already exists")
        void createDuplicateCode_throwsException() {
            CreateMapIconRequest request = new CreateMapIconRequest();
            request.setName("Cảng");
            request.setCode("PORT");

            when(mapIconRepository.existsByCode("PORT")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> mapIconService.create(request));
            verify(mapIconRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Read MapIcons")
    class ReadTests {

        @Test
        @DisplayName("Should find map icon by ID")
        void findById_success() {
            when(mapIconRepository.findById(testIconId)).thenReturn(Optional.of(testIcon));

            MapIconResponse result = mapIconService.findById(testIconId);
            assertNotNull(result);
            assertEquals(testIcon.getCode(), result.getCode());
        }

        @Test
        @DisplayName("Should throw when map icon not found")
        void findById_notFound_throws() {
            when(mapIconRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class, () -> mapIconService.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should return all map icons flat list")
        void findAll_success() {
            when(mapIconRepository.findAll()).thenReturn(List.of(testIcon));

            List<MapIconResponse> result = mapIconService.findAll();
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find map icons by Category")
        void findByCategory_success() {
            when(mapIconRepository.findByCategory(Category.WHARF)).thenReturn(List.of(testIcon));

            List<MapIconResponse> result = mapIconService.findByCategory(Category.WHARF);
            assertEquals(1, result.size());
        }
    }

    @Nested
    @DisplayName("Update MapIcon")
    class UpdateTests {

        @Test
        @DisplayName("Should update map icon details")
        void updateIcon_success() {
            UpdateMapIconRequest request = new UpdateMapIconRequest();
            request.setName("Cảng biển mới");

            when(mapIconRepository.findById(testIconId)).thenReturn(Optional.of(testIcon));
            when(mapIconRepository.save(any(MapIcon.class))).thenReturn(testIcon);

            MapIconResponse result = mapIconService.update(testIconId, request);

            assertNotNull(result);
            verify(mapIconRepository).save(any(MapIcon.class));
        }
    }

    @Nested
    @DisplayName("Delete MapIcon")
    class DeleteTests {

        @Test
        @DisplayName("Should delete map icon successfully")
        void deleteIcon_success() {
            when(mapIconRepository.findById(testIconId)).thenReturn(Optional.of(testIcon));
            when(mapIconRepository.save(any(MapIcon.class))).thenReturn(testIcon);

            mapIconService.delete(testIconId);

            verify(mapIconRepository).save(testIcon);
        }
    }
}
