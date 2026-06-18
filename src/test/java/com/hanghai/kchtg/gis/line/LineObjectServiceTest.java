package com.hanghai.kchtg.gis.line;

import com.hanghai.kchtg.gis.line.dto.CreateLineObjectRequest;
import com.hanghai.kchtg.gis.line.dto.LineObjectResponse;
import com.hanghai.kchtg.gis.line.dto.UpdateLineObjectRequest;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.entity.LineObject.ApprovalStatus;
import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
import com.hanghai.kchtg.gis.line.entity.LineHistory;
import com.hanghai.kchtg.gis.line.repository.LineHistoryRepository;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.line.service.LineObjectService;
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
class LineObjectServiceTest {

    @Mock
    private LineObjectRepository repository;

    @Mock
    private LineHistoryRepository historyRepository;

    @InjectMocks
    private LineObjectService service;

    private LineObject testLine;

    private LineObject newLineEntity() {
        LineObject e = new LineObject();
        e.setId(testLine.getId());
        e.setName("Coastal Route A");
        e.setCode("LINE-001");
        e.setObjectType(ObjectType.COASTLINE);
        e.setCoordinates("LINESTRING (106.6 10.7, 106.7 10.8, 106.8 10.9)");
        e.setDescription("Coastal shipping route");
        e.setUnitId(1L);
        e.setCategoryId(1L);
        e.setLineSymbolId(1L);
        e.setLength(15000.0);
        e.setMaterial("Concrete");
        e.setYearBuilt(2020);
        e.setApprovalStatus(ApprovalStatus.PENDING);
        e.setStatus(Status.DRAFT);
        return e;
    }

    @BeforeEach
    void setUp() {
        testLine = LineObject.builder()
                .name("Coastal Route A")
                .code("LINE-001")
                .objectType(ObjectType.COASTLINE)
                .categoryId(1L)
                .lineSymbolId(1L)
                .coordinates("LINESTRING (106.6 10.7, 106.7 10.8, 106.8 10.9)")
                .description("Coastal shipping route")
                .status(Status.DRAFT)
                .unitId(1L)
                .length(15000.0)
                .material("Concrete")
                .yearBuilt(2020)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();
        testLine.setId(UUID.randomUUID());
        testLine.setCreatedAt(LocalDateTime.now());
        testLine.setUpdatedAt(LocalDateTime.now());
    }

    // ==================== CREATE TESTS ====================

    @Nested
    @DisplayName("Create LineObject")
    class CreateTests {

        @Test
        @DisplayName("Should create line object successfully")
        void create_success() {
            // Arrange
            CreateLineObjectRequest request = CreateLineObjectRequest.builder()
                    .name("Route B")
                    .code("LINE-001")
                    .objectType(ObjectType.COASTLINE)
                    .coordinates("LINESTRING (106.5 10.0, 107.0 10.5)")
                    .length(20000.0)
                    .status(Status.DRAFT)
                    .build();

            when(repository.existsByCode("LINE-001")).thenReturn(false);
            when(repository.save(any(LineObject.class))).thenReturn(testLine);

            // Act
            LineObjectResponse result = service.create(request);

            // Assert
            assertNotNull(result);
            assertEquals("LINE-001", result.getCode());
            verify(repository).save(any(LineObject.class));
        }

        @Test
        @DisplayName("Should throw when code already exists")
        void create_duplicateCode_throws() {
            // Arrange
            CreateLineObjectRequest request = CreateLineObjectRequest.builder()
                    .name("Dup Line")
                    .code("LINE-DUP")
                    .objectType(ObjectType.COASTLINE)
                    .coordinates("LINESTRING (0 0, 1 1)")
                    .build();

            when(repository.existsByCode("LINE-DUP")).thenReturn(true);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when coordinates is null")
        void create_nullCoordinates_throws() {
            // Arrange
            CreateLineObjectRequest request = CreateLineObjectRequest.builder()
                    .name("No Coords Line")
                    .code("LINE-NC")
                    .objectType(ObjectType.COASTLINE)
                    .build();

            when(repository.existsByCode("LINE-NC")).thenReturn(false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when coordinates is empty string")
        void create_emptyCoordinates_throws() {
            // Arrange
            CreateLineObjectRequest request = CreateLineObjectRequest.builder()
                    .name("Empty Coords Line")
                    .code("LINE-EC")
                    .objectType(ObjectType.COASTLINE)
                    .coordinates("")
                    .build();

            when(repository.existsByCode("LINE-EC")).thenReturn(false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when coordinates is not valid WKT")
        void create_invalidWKT_throws() {
            // Arrange
            CreateLineObjectRequest request = CreateLineObjectRequest.builder()
                    .name("Bad WKT Line")
                    .code("LINE-BAD")
                    .objectType(ObjectType.COASTLINE)
                    .coordinates("NOT_A_WKT_FORMAT")
                    .build();

            when(repository.existsByCode("LINE-BAD")).thenReturn(false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should accept valid WKT LINESTRING")
        void create_validWKT_LINESTRING_accepted() {
            // Arrange
            CreateLineObjectRequest request = CreateLineObjectRequest.builder()
                    .name("Valid WKT Line")
                    .code("LINE-WKT")
                    .objectType(ObjectType.COASTLINE)
                    .coordinates("LINESTRING (106.6297 10.7769, 106.7 10.8)")
                    .length(5000.0)
                    .build();

            when(repository.existsByCode("LINE-WKT")).thenReturn(false);
            when(repository.save(any(LineObject.class))).thenReturn(testLine);

            // Act
            LineObjectResponse result = service.create(request);

            // Assert
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should accept GeoJSON format coordinates")
        void create_geoJsonCoordinates_accepted() {
            // Arrange
            CreateLineObjectRequest request = CreateLineObjectRequest.builder()
                    .name("GeoJSON Line")
                    .code("LINE-GJ")
                    .objectType(ObjectType.COASTLINE)
                    .coordinates("{\"type\":\"LineString\",\"coordinates\":[[106.6,10.7],[106.7,10.8]]}")
                    .length(3000.0)
                    .build();

            when(repository.existsByCode("LINE-GJ")).thenReturn(false);
            when(repository.save(any(LineObject.class))).thenReturn(testLine);

            // Act
            LineObjectResponse result = service.create(request);

            // Assert
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should create with length auto-calc")
        void create_withLength_accepted() {
            // Arrange
            CreateLineObjectRequest request = CreateLineObjectRequest.builder()
                    .name("Measured Line")
                    .code("LINE-LEN")
                    .objectType(ObjectType.COASTLINE)
                    .coordinates("LINESTRING (106.6 10.7, 107.0 11.0)")
                    .length(15000.0)
                    .material("Steel")
                    .yearBuilt(2023)
                    .build();

            when(repository.existsByCode("LINE-LEN")).thenReturn(false);
            when(repository.save(any(LineObject.class))).thenReturn(testLine);

            // Act
            LineObjectResponse result = service.create(request);

            // Assert
            assertNotNull(result);
            assertEquals(15000.0, result.getLength());
            verify(repository).save(any(LineObject.class));
        }
    }

    // ==================== READ TESTS ====================

    @Nested
    @DisplayName("Read LineObjects")
    class ReadTests {

        @Test
        @DisplayName("Should find line by ID")
        void findById_success() {
            when(repository.findById(testLine.getId())).thenReturn(Optional.of(testLine));

            LineObjectResponse result = service.findById(testLine.getId());

            assertNotNull(result);
            assertEquals(testLine.getCode(), result.getCode());
        }

        @Test
        @DisplayName("Should throw when line not found")
        void findById_notFound_throws() {
            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should find all lines")
        void findAll_success() {
            when(repository.findAll()).thenReturn(List.of(testLine));

            List<LineObjectResponse> result = service.findAll();

            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find by ObjectType")
        void findByObjectType_success() {
            when(repository.findByObjectType(ObjectType.COASTLINE)).thenReturn(List.of(testLine));

            List<LineObjectResponse> result = service.findByObjectType(ObjectType.COASTLINE);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find by Status")
        void findByStatus_success() {
            when(repository.findByStatus(Status.PUBLISHED)).thenReturn(List.of(testLine));

            List<LineObjectResponse> result = service.findByStatus(Status.PUBLISHED);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should search with filters")
        void search_success() {
            when(repository.searchFiltered("Route", "LINE-001", ObjectType.COASTLINE, Status.DRAFT))
                    .thenReturn(List.of(testLine));

            List<LineObjectResponse> result = service.search("Route", "LINE-001", ObjectType.COASTLINE, Status.DRAFT);

            assertEquals(1, result.size());
        }
    }

    // ==================== UPDATE TESTS ====================

    @Nested
    @DisplayName("Update LineObject")
    class UpdateTests {

        @Test
        @DisplayName("Should update line name")
        void update_name_success() {
            LineObject existing = LineObject.builder()
                    .name("Old Route")
                    .code("LINE-001")
                    .objectType(ObjectType.COASTLINE)
                    .categoryId(1L)
                    .lineSymbolId(1L)
                    .coordinates("LINESTRING (106.6 10.7, 106.7 10.8, 106.8 10.9)")
                    .description("Coastal shipping route")
                    .status(Status.DRAFT)
                    .unitId(1L)
                    .length(15000.0)
                    .material("Concrete")
                    .yearBuilt(2020)
                    .approvalStatus(ApprovalStatus.PENDING)
                    .build();
            existing.setId(testLine.getId());
            existing.setCreatedAt(testLine.getCreatedAt());
            existing.setUpdatedAt(testLine.getUpdatedAt());

            UpdateLineObjectRequest request = UpdateLineObjectRequest.builder()
                    .name("New Route Name")
                    .build();

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(LineObject.class))).thenReturn(existing);

            LineObjectResponse result = service.update(testLine.getId(), request);

            assertNotNull(result);
            verify(repository).save(any(LineObject.class));
        }

        @Test
        @DisplayName("Should update coordinates with WKT validation")
        void update_coordinates_validated() {
            LineObject existing = newLineEntity();

            UpdateLineObjectRequest request = UpdateLineObjectRequest.builder()
                    .coordinates("LINESTRING (106.0 10.0, 107.0 11.0)")
                    .build();

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(LineObject.class))).thenReturn(existing);

            LineObjectResponse result = service.update(testLine.getId(), request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should throw when updating with invalid WKT")
        void update_invalidCoordinates_throws() {
            LineObject existing = newLineEntity();

            UpdateLineObjectRequest request = UpdateLineObjectRequest.builder()
                    .coordinates("INVALID_WKT")
                    .build();

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));

            assertThrows(IllegalArgumentException.class,
                    () -> service.update(testLine.getId(), request));
        }

        @Test
        @DisplayName("Should throw when line not found for update")
        void update_notFound_throws() {
            UpdateLineObjectRequest request = UpdateLineObjectRequest.builder()
                    .name("Nonexistent")
                    .build();

            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.update(UUID.randomUUID(), request));
        }

        @Test
        @DisplayName("Should update length field")
        void update_length_success() {
            LineObject existing = newLineEntity();

            UpdateLineObjectRequest request = UpdateLineObjectRequest.builder()
                    .length(25000.0)
                    .build();

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(LineObject.class))).thenReturn(existing);

            LineObjectResponse result = service.update(testLine.getId(), request);

            assertNotNull(result);
            verify(repository).save(any(LineObject.class));
        }
    }

    // ==================== DELETE TESTS ====================

    @Nested
    @DisplayName("Delete LineObject")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete line object")
        void delete_success() {
            LineObject existing = newLineEntity();
            existing.setStatus(Status.DRAFT);

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(LineObject.class))).thenReturn(existing);

            service.delete(testLine.getId());

            assertEquals(Status.DELETED, existing.getStatus());
            verify(repository).save(existing);
        }

        @Test
        @DisplayName("Should throw when deleting nonexistent line")
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
            LineObject existing = newLineEntity();
            existing.setStatus(Status.DRAFT);

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(LineObject.class))).thenReturn(existing);

            service.submitForApproval(testLine.getId());

            assertEquals(Status.PENDING_APPROVAL, existing.getStatus());
            verify(repository).save(existing);
        }

        @Test
        @DisplayName("Should approve L1: PENDING -> APPROVED_L1")
        void approveL1_success() {
            LineObject existing = newLineEntity();
            existing.setStatus(Status.PENDING_APPROVAL);
            existing.setApprovalStatus(ApprovalStatus.PENDING);

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(LineObject.class))).thenReturn(existing);
            when(historyRepository.save(any(LineHistory.class))).thenReturn(LineHistory.builder().build());

            LineObjectResponse result = service.approveL1(testLine.getId(), "1");

            assertNotNull(result);
            assertEquals(Status.APPROVED_L1, existing.getStatus());
            assertEquals(ApprovalStatus.APPROVED, existing.getApprovalStatus());
            assertEquals(Long.valueOf(1L), existing.getApprovedBy());
            assertNotNull(existing.getApprovedDate());
            verify(repository).save(existing);
            verify(historyRepository).save(any(LineHistory.class));
        }

        @Test
        @DisplayName("Should throw L1 when not PENDING_APPROVAL")
        void approveL1_wrongStatus_throws() {
            LineObject existing = newLineEntity();
            existing.setStatus(Status.DRAFT);

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.approveL1(testLine.getId(), "1"));
            assertTrue(ex.getMessage().contains("PENDING_APPROVAL"));
        }

        @Test
        @DisplayName("Should approve L2: APPROVED_L1 -> APPROVED_L2")
        void approveL2_success() {
            LineObject existing = newLineEntity();
            existing.setStatus(Status.APPROVED_L1);

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(LineObject.class))).thenReturn(existing);
            when(historyRepository.save(any(LineHistory.class))).thenReturn(LineHistory.builder().build());

            LineObjectResponse result = service.approveL2(testLine.getId(), "2");

            assertNotNull(result);
            assertEquals(Status.APPROVED_L2, existing.getStatus());
            verify(repository).save(existing);
            verify(historyRepository).save(any(LineHistory.class));
        }

        @Test
        @DisplayName("Should throw L2 when not APPROVED_L1")
        void approveL2_wrongStatus_throws() {
            LineObject existing = newLineEntity();
            existing.setStatus(Status.PENDING_APPROVAL);

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(existing));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.approveL2(testLine.getId(), "2"));
            assertTrue(ex.getMessage().contains("APPROVED_L1"));
        }

        @Test
        @DisplayName("Full approval chain: DRAFT -> PENDING -> L1 -> L2")
        void fullApprovalChain_success() {
            LineObject entity = newLineEntity();
            entity.setStatus(Status.DRAFT);

            when(repository.findById(testLine.getId())).thenReturn(Optional.of(entity));
            when(repository.save(any(LineObject.class))).thenAnswer(inv -> entity);
            when(historyRepository.save(any(LineHistory.class))).thenReturn(LineHistory.builder().build());

            service.submitForApproval(testLine.getId());
            assertEquals(Status.PENDING_APPROVAL, entity.getStatus());

            service.approveL1(testLine.getId(), "100");
            assertEquals(Status.APPROVED_L1, entity.getStatus());

            service.approveL2(testLine.getId(), "200");
            assertEquals(Status.APPROVED_L2, entity.getStatus());

            verify(repository, times(3)).save(any(LineObject.class));
            verify(historyRepository, times(2)).save(any(LineHistory.class));
        }

        @Test
        @DisplayName("Should throw when approving nonexistent line")
        void approve_nonexistent_throws() {
            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.approveL1(UUID.randomUUID(), "1"));
        }
    }
}


