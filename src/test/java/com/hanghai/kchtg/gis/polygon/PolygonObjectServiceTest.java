package com.hanghai.kchtg.gis.polygon;

import com.hanghai.kchtg.gis.polygon.dto.CreatePolygonObjectRequest;
import com.hanghai.kchtg.gis.polygon.dto.PolygonObjectResponse;
import com.hanghai.kchtg.gis.polygon.dto.UpdatePolygonObjectRequest;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ApprovalStatus;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ObjectType;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status;
import com.hanghai.kchtg.gis.polygon.entity.PolygonHistory;
import com.hanghai.kchtg.gis.polygon.repository.PolygonHistoryRepository;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.gis.polygon.service.PolygonObjectService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PolygonObjectServiceTest {

    @Mock
    private PolygonObjectRepository repository;

    @Mock
    private PolygonHistoryRepository historyRepository;

    @InjectMocks
    private PolygonObjectService service;

    private PolygonObject testPolygon;

    @BeforeEach
    void setUp() {
        testPolygon = PolygonObject.builder()
                .name("Port Zone A")
                .code("POLY-001")
                .objectType(ObjectType.WATER_ZONE)
                .categoryId(1L)
                .fillSymbolId(1L)
                .coordinates("POLYGON ((106.6 10.7, 106.7 10.7, 106.7 10.8, 106.6 10.8, 106.6 10.7))")
                .description("Port operational zone")
                .status(Status.DRAFT)
                .unitId(1L)
                .area(50000.0)
                .purpose("Port operations")
                .restrictionLevel("Medium")
                .approvalStatus(ApprovalStatus.PENDING)
                .build();
        testPolygon.setId(UUID.randomUUID());
        testPolygon.setCreatedAt(LocalDateTime.now());
        testPolygon.setUpdatedAt(LocalDateTime.now());
    }

    private PolygonObject clonePolygon(PolygonObject original) {
        PolygonObject copy = PolygonObject.builder()
                .name(original.getName())
                .code(original.getCode())
                .objectType(original.getObjectType())
                .categoryId(original.getCategoryId())
                .fillSymbolId(original.getFillSymbolId())
                .coordinates(original.getCoordinates())
                .description(original.getDescription())
                .status(original.getStatus())
                .unitId(original.getUnitId())
                .area(original.getArea())
                .purpose(original.getPurpose())
                .restrictionLevel(original.getRestrictionLevel())
                .approvalStatus(original.getApprovalStatus())
                .build();
        copy.setId(original.getId());
        copy.setCreatedAt(original.getCreatedAt());
        copy.setUpdatedAt(original.getUpdatedAt());
        return copy;
    }

    // ==================== CREATE TESTS ====================

    @Nested
    @DisplayName("Create PolygonObject")
    class CreateTests {

        @Test
        @DisplayName("Should create polygon object successfully")
        void create_success() {
            CreatePolygonObjectRequest request = CreatePolygonObjectRequest.builder()
                    .name("Zone B")
                    .code("POLY-001")
                    .objectType(ObjectType.WATER_ZONE)
                    .coordinates("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))")
                    .area(100000.0)
                    .purpose("Shipping zone")
                    .status(Status.DRAFT)
                    .build();

            when(repository.existsByCode("POLY-001")).thenReturn(false);
            when(repository.save(any(PolygonObject.class))).thenReturn(testPolygon);

            PolygonObjectResponse result = service.create(request);

            assertNotNull(result);
            assertEquals("POLY-001", result.getCode());
            verify(repository).save(any(PolygonObject.class));
        }

        @Test
        @DisplayName("Should throw when code already exists")
        void create_duplicateCode_throws() {
            CreatePolygonObjectRequest request = CreatePolygonObjectRequest.builder()
                    .name("Dup Polygon")
                    .code("POLY-DUP")
                    .objectType(ObjectType.WATER_ZONE)
                    .coordinates("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))")
                    .build();

            when(repository.existsByCode("POLY-DUP")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when coordinates is null")
        void create_nullCoordinates_throws() {
            CreatePolygonObjectRequest request = CreatePolygonObjectRequest.builder()
                    .name("No Coords Poly")
                    .code("POLY-NC")
                    .objectType(ObjectType.WATER_ZONE)
                    .build();

            when(repository.existsByCode("POLY-NC")).thenReturn(false);

            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when coordinates is empty")
        void create_emptyCoordinates_throws() {
            CreatePolygonObjectRequest request = CreatePolygonObjectRequest.builder()
                    .name("Empty Coords Poly")
                    .code("POLY-EC")
                    .objectType(ObjectType.WATER_ZONE)
                    .coordinates("")
                    .build();

            when(repository.existsByCode("POLY-EC")).thenReturn(false);

            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when coordinates is not valid WKT POLYGON")
        void create_invalidWKT_throws() {
            CreatePolygonObjectRequest request = CreatePolygonObjectRequest.builder()
                    .name("Bad WKT Poly")
                    .code("POLY-BAD")
                    .objectType(ObjectType.WATER_ZONE)
                    .coordinates("NOT_A_WKT")
                    .build();

            when(repository.existsByCode("POLY-BAD")).thenReturn(false);

            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should accept valid WKT POLYGON")
        void create_validWKT_POLYGON_accepted() {
            CreatePolygonObjectRequest request = CreatePolygonObjectRequest.builder()
                    .name("Valid WKT Poly")
                    .code("POLY-WKT")
                    .objectType(ObjectType.WATER_ZONE)
                    .coordinates("POLYGON ((106.6 10.7, 106.7 10.7, 106.7 10.8, 106.6 10.8, 106.6 10.7))")
                    .area(25000.0)
                    .build();

            when(repository.existsByCode("POLY-WKT")).thenReturn(false);
            when(repository.save(any(PolygonObject.class))).thenReturn(testPolygon);

            PolygonObjectResponse result = service.create(request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should accept GeoJSON format coordinates")
        void create_geoJsonCoordinates_accepted() {
            CreatePolygonObjectRequest request = CreatePolygonObjectRequest.builder()
                    .name("GeoJSON Poly")
                    .code("POLY-GJ")
                    .objectType(ObjectType.WATER_ZONE)
                    .coordinates("{\"type\":\"Polygon\",\"coordinates\":[[[106.6,10.7],[106.7,10.7],[106.7,10.8],[106.6,10.8],[106.6,10.7]]]}")
                    .area(30000.0)
                    .build();

            when(repository.existsByCode("POLY-GJ")).thenReturn(false);
            when(repository.save(any(PolygonObject.class))).thenReturn(testPolygon);

            PolygonObjectResponse result = service.create(request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should create with area auto-calc")
        void create_withArea_accepted() {
            CreatePolygonObjectRequest request = CreatePolygonObjectRequest.builder()
                    .name("Area Poly")
                    .code("POLY-AREA")
                    .objectType(ObjectType.WATER_ZONE)
                    .coordinates("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")
                    .area(1000000.0)
                    .purpose("Naval zone")
                    .restrictionLevel("High")
                    .build();

            when(repository.existsByCode("POLY-AREA")).thenReturn(false);
            when(repository.save(any(PolygonObject.class))).thenAnswer(inv -> inv.getArgument(0));

            PolygonObjectResponse result = service.create(request);

            assertNotNull(result);
            assertEquals(1000000.0, result.getArea());
        }
    }

    // ==================== READ TESTS ====================

    @Nested
    @DisplayName("Read PolygonObjects")
    class ReadTests {

        @Test
        @DisplayName("Should find polygon by ID")
        void findById_success() {
            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(testPolygon));

            PolygonObjectResponse result = service.findById(testPolygon.getId());

            assertNotNull(result);
            assertEquals(testPolygon.getCode(), result.getCode());
        }

        @Test
        @DisplayName("Should throw when polygon not found")
        void findById_notFound_throws() {
            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should find all polygons")
        void findAll_success() {
            when(repository.findAll()).thenReturn(List.of(testPolygon));

            List<PolygonObjectResponse> result = service.findAll();

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find by ObjectType")
        void findByObjectType_success() {
            when(repository.findByObjectType(ObjectType.WATER_ZONE)).thenReturn(List.of(testPolygon));

            List<PolygonObjectResponse> result = service.findByObjectType(ObjectType.WATER_ZONE);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find by Status")
        void findByStatus_success() {
            when(repository.findByStatus(Status.PUBLISHED)).thenReturn(List.of(testPolygon));

            List<PolygonObjectResponse> result = service.findByStatus(Status.PUBLISHED);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should search with filters")
        void search_success() {
            when(repository.searchFiltered("Zone", "POLY-001", ObjectType.WATER_ZONE, Status.DRAFT))
                    .thenReturn(List.of(testPolygon));

            List<PolygonObjectResponse> result = service.search("Zone", "POLY-001", ObjectType.WATER_ZONE, Status.DRAFT);

            assertEquals(1, result.size());
        }
    }

    // ==================== UPDATE TESTS ====================

    @Nested
    @DisplayName("Update PolygonObject")
    class UpdateTests {

        @Test
        @DisplayName("Should update polygon name and purpose")
        void update_nameAndPurpose_success() {
            PolygonObject existing = clonePolygon(testPolygon);

            UpdatePolygonObjectRequest request = UpdatePolygonObjectRequest.builder()
                    .name("Updated Zone")
                    .purpose("Updated purpose")
                    .build();

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PolygonObject.class))).thenReturn(existing);

            PolygonObjectResponse result = service.update(testPolygon.getId(), request);

            assertNotNull(result);
            verify(repository).save(any(PolygonObject.class));
        }

        @Test
        @DisplayName("Should update coordinates with WKT validation")
        void update_coordinates_validated() {
            PolygonObject existing = clonePolygon(testPolygon);

            UpdatePolygonObjectRequest request = UpdatePolygonObjectRequest.builder()
                    .coordinates("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")
                    .build();

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PolygonObject.class))).thenReturn(existing);

            PolygonObjectResponse result = service.update(testPolygon.getId(), request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should throw when updating with invalid WKT")
        void update_invalidCoordinates_throws() {
            PolygonObject existing = clonePolygon(testPolygon);

            UpdatePolygonObjectRequest request = UpdatePolygonObjectRequest.builder()
                    .coordinates("INVALID_WKT")
                    .build();

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));

            assertThrows(IllegalArgumentException.class,
                    () -> service.update(testPolygon.getId(), request));
        }

        @Test
        @DisplayName("Should throw when polygon not found for update")
        void update_notFound_throws() {
            UpdatePolygonObjectRequest request = UpdatePolygonObjectRequest.builder()
                    .name("Nonexistent")
                    .build();

            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.update(UUID.randomUUID(), request));
        }

        @Test
        @DisplayName("Should update area and restriction level")
        void update_areaAndRestriction_success() {
            PolygonObject existing = clonePolygon(testPolygon);

            UpdatePolygonObjectRequest request = UpdatePolygonObjectRequest.builder()
                    .area(200000.0)
                    .restrictionLevel("High")
                    .build();

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PolygonObject.class))).thenReturn(existing);

            PolygonObjectResponse result = service.update(testPolygon.getId(), request);

            assertNotNull(result);
            verify(repository).save(any(PolygonObject.class));
        }
    }

    // ==================== DELETE TESTS ====================

    @Nested
    @DisplayName("Delete PolygonObject")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete polygon object")
        void delete_success() {
            PolygonObject existing = clonePolygon(testPolygon);
            existing.setStatus(Status.DRAFT);

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PolygonObject.class))).thenReturn(existing);

            service.delete(testPolygon.getId());

            assertEquals(Status.DELETED, existing.getStatus());
            verify(repository).save(existing);
        }

        @Test
        @DisplayName("Should throw when deleting nonexistent polygon")
        void delete_notFound_throws() {
            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.delete(UUID.randomUUID()));
        }
    }

    // ==================== APPROVAL WORKFLOW TESTS ====================

    @Nested
    @DisplayName("Approval Workflow")
    class ApprovalTests {

        @Test
        @DisplayName("Should submit for approval")
        void submitForApproval_success() {
            PolygonObject existing = clonePolygon(testPolygon);
            existing.setStatus(Status.DRAFT);

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PolygonObject.class))).thenReturn(existing);

            service.submitForApproval(testPolygon.getId());

            assertEquals(Status.PENDING_APPROVAL, existing.getStatus());
        }

        @Test
        @DisplayName("Should approve L1: PENDING -> APPROVED_L1")
        void approveL1_success() {
            PolygonObject existing = clonePolygon(testPolygon);
            existing.setStatus(Status.PENDING_APPROVAL);
            existing.setApprovalStatus(ApprovalStatus.PENDING);

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PolygonObject.class))).thenReturn(existing);
            when(historyRepository.save(any(PolygonHistory.class))).thenReturn(PolygonHistory.builder().build());

            PolygonObjectResponse result = service.approveL1(testPolygon.getId(), "1");

            assertNotNull(result);
            assertEquals(Status.APPROVED_L1, existing.getStatus());
            assertEquals(ApprovalStatus.APPROVED, existing.getApprovalStatus());
            verify(repository).save(existing);
            verify(historyRepository).save(any(PolygonHistory.class));
        }

        @Test
        @DisplayName("Should throw L1 when not PENDING_APPROVAL")
        void approveL1_wrongStatus_throws() {
            PolygonObject existing = clonePolygon(testPolygon);
            existing.setStatus(Status.DRAFT);

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.approveL1(testPolygon.getId(), "1"));
            assertTrue(ex.getMessage().contains("PENDING_APPROVAL"));
        }

        @Test
        @DisplayName("Should approve L2: APPROVED_L1 -> PUBLISHED")
        void approveL2_success() {
            PolygonObject existing = clonePolygon(testPolygon);
            existing.setStatus(Status.APPROVED_L1);

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PolygonObject.class))).thenReturn(existing);
            when(historyRepository.save(any(PolygonHistory.class))).thenReturn(PolygonHistory.builder().build());

            PolygonObjectResponse result = service.approveL2(testPolygon.getId(), "2");

            assertNotNull(result);
            assertEquals(Status.PUBLISHED, existing.getStatus());
            verify(repository).save(existing);
            verify(historyRepository).save(any(PolygonHistory.class));
        }

        @Test
        @DisplayName("Should throw L2 when not APPROVED_L1")
        void approveL2_wrongStatus_throws() {
            PolygonObject existing = clonePolygon(testPolygon);
            existing.setStatus(Status.PENDING_APPROVAL);

            when(repository.findById(testPolygon.getId())).thenReturn(Optional.of(existing));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.approveL2(testPolygon.getId(), "2"));
            assertTrue(ex.getMessage().contains("APPROVED_L1"));
        }

        @Test
        @DisplayName("Full approval chain: DRAFT -> PENDING -> L1 -> L2")
        void fullApprovalChain_success() {
            PolygonObject entity = clonePolygon(testPolygon);
            entity.setStatus(Status.DRAFT);

            when(repository.findById(entity.getId())).thenReturn(Optional.of(entity));
            when(repository.save(any(PolygonObject.class))).thenAnswer(inv -> entity);
            when(historyRepository.save(any(PolygonHistory.class))).thenReturn(PolygonHistory.builder().build());

            service.submitForApproval(entity.getId());
            assertEquals(Status.PENDING_APPROVAL, entity.getStatus());

            service.approveL1(entity.getId(), "100");
            assertEquals(Status.APPROVED_L1, entity.getStatus());

            service.approveL2(entity.getId(), "200");
            assertEquals(Status.PUBLISHED, entity.getStatus());

            verify(repository, times(3)).save(any(PolygonObject.class));
            verify(historyRepository, times(2)).save(any(PolygonHistory.class));
        }

        @Test
        @DisplayName("Should throw when approving nonexistent polygon")
        void approve_nonexistent_throws() {
            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.approveL1(UUID.randomUUID(), "1"));
        }
    }
}

