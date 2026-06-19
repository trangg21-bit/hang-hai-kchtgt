package com.hanghai.kchtg.gis.point;

import com.hanghai.kchtg.gis.point.dto.CreatePointObjectRequest;
import com.hanghai.kchtg.gis.point.dto.PointObjectResponse;
import com.hanghai.kchtg.gis.point.dto.UpdatePointObjectRequest;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.entity.PointObject.ApprovalStatus;
import com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
import com.hanghai.kchtg.gis.point.entity.PointHistory;
import com.hanghai.kchtg.gis.point.repository.PointHistoryRepository;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.point.service.PointObjectService;
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
class PointObjectServiceTest {

    @Mock
    private PointObjectRepository repository;

    @Mock
    private PointHistoryRepository historyRepository;

    @InjectMocks
    private PointObjectService service;

    private PointObject testPoint;

    private PointObject newPointEntity() {
        PointObject e = new PointObject();
        e.setId(testPoint.getId());
        e.setName("Test Port");
        e.setCode("PORT-001");
        e.setObjectType(ObjectType.PORT);
        e.setLongitude(106.6297);
        e.setLatitude(10.7769);
        e.setDescription("Test port description");
        e.setUnitId(1L);
        e.setCategoryId(1L);
        e.setIconId(1L);
        e.setApprovalStatus(ApprovalStatus.PENDING);
        e.setStatus(Status.DRAFT);
        return e;
    }

    @BeforeEach
    void setUp() {
        testPoint = PointObject.builder()
                .name("Test Port")
                .code("PORT-001")
                .objectType(ObjectType.PORT)
                .categoryId(1L)
                .iconId(1L)
                .longitude(106.6297)
                .latitude(10.7769)
                .description("Test port description")
                .status(Status.DRAFT)
                .unitId(1L)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();
        testPoint.setId(UUID.randomUUID());
        testPoint.setCreatedAt(LocalDateTime.now());
        testPoint.setUpdatedAt(LocalDateTime.now());
    }

    // ==================== CREATE TESTS ====================

    @Nested
    @DisplayName("Create PointObject")
    class CreateTests {

        @Test
        @DisplayName("Should create point object successfully")
        void create_success() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("Cai Mep Port")
                    .code("PORT-001")
                    .objectType(ObjectType.PORT)
                    .longitude(107.05)
                    .latitude(10.55)
                    .description("Cai Mep deep water port")
                    .status(Status.DRAFT)
                    .build();

            when(repository.existsByCode("PORT-001")).thenReturn(false);
            when(repository.save(any(PointObject.class))).thenReturn(testPoint);

            // Act
            PointObjectResponse result = service.create(request);

            // Assert
            assertNotNull(result);
            assertEquals("PORT-001", result.getCode());
            verify(repository).save(any(PointObject.class));
        }

        @Test
        @DisplayName("Should throw when code already exists")
        void create_duplicateCode_throws() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("Dup Port")
                    .code("PORT-DUP")
                    .objectType(ObjectType.PORT)
                    .longitude(107.0)
                    .latitude(10.5)
                    .build();

            when(repository.existsByCode("PORT-DUP")).thenReturn(true);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when longitude out of WGS84 bounds (< -180)")
        void create_invalidLongitude_negative_throws() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("Bad Lon Port")
                    .code("PORT-BAD")
                    .objectType(ObjectType.PORT)
                    .longitude(-181.0)
                    .latitude(10.5)
                    .build();

            when(repository.existsByCode("PORT-BAD")).thenReturn(false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when longitude out of WGS84 bounds (> 180)")
        void create_invalidLongitude_positive_throws() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("Bad Lon Port")
                    .code("PORT-BAD")
                    .objectType(ObjectType.PORT)
                    .longitude(181.0)
                    .latitude(10.5)
                    .build();

            when(repository.existsByCode("PORT-BAD")).thenReturn(false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when latitude out of WGS84 bounds (< -90)")
        void create_invalidLatitude_negative_throws() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("Bad Lat Port")
                    .code("PORT-BAD")
                    .objectType(ObjectType.PORT)
                    .longitude(107.0)
                    .latitude(-91.0)
                    .build();

            when(repository.existsByCode("PORT-BAD")).thenReturn(false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when latitude out of WGS84 bounds (> 90)")
        void create_invalidLatitude_positive_throws() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("Bad Lat Port")
                    .code("PORT-BAD")
                    .objectType(ObjectType.PORT)
                    .longitude(107.0)
                    .latitude(91.0)
                    .build();

            when(repository.existsByCode("PORT-BAD")).thenReturn(false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should accept boundary WGS84 coordinates (-180/-90)")
        void create_boundaryCoordinates_negative_accepted() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("Boundary Port")
                    .code("PORT-BOUND")
                    .objectType(ObjectType.PORT)
                    .longitude(-180.0)
                    .latitude(-90.0)
                    .build();

            when(repository.existsByCode("PORT-BOUND")).thenReturn(false);
            when(repository.save(any(PointObject.class))).thenReturn(testPoint);

            // Act
            PointObjectResponse result = service.create(request);

            // Assert
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should accept boundary WGS84 coordinates (180/90)")
        void create_boundaryCoordinates_positive_accepted() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("Boundary Port")
                    .code("PORT-BOUND2")
                    .objectType(ObjectType.PORT)
                    .longitude(180.0)
                    .latitude(90.0)
                    .build();

            when(repository.existsByCode("PORT-BOUND2")).thenReturn(false);
            when(repository.save(any(PointObject.class))).thenReturn(testPoint);

            // Act
            PointObjectResponse result = service.create(request);

            // Assert
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should create with all ObjectType enum values")
        void create_withAllObjectTypes() {
            for (ObjectType type : ObjectType.values()) {
                CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                        .name("Type " + type.name())
                        .code("CODE-" + type.name())
                        .objectType(type)
                        .longitude(107.0)
                        .latitude(10.5)
                        .build();

                when(repository.existsByCode("CODE-" + type.name())).thenReturn(false);
                when(repository.save(any(PointObject.class))).thenAnswer(inv -> inv.getArgument(0));

                PointObjectResponse result = service.create(request);
                assertNotNull(result);
                assertEquals(type, result.getObjectType());
            }
        }
    }

    // ==================== READ TESTS ====================

    @Nested
    @DisplayName("Read PointObjects")
    class ReadTests {

        @Test
        @DisplayName("Should find point by ID")
        void findById_success() {
            // Arrange
            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(testPoint));

            // Act
            PointObjectResponse result = service.findById(testPoint.getId());

            // Assert
            assertNotNull(result);
            assertEquals(testPoint.getCode(), result.getCode());
            verify(repository).findById(testPoint.getId());
        }

        @Test
        @DisplayName("Should throw when point not found by ID")
        void findById_notFound_throws() {
            // Arrange
            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(EntityNotFoundException.class,
                    () -> service.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should find all point objects")
        void findAll_success() {
            // Arrange
            when(repository.findAll()).thenReturn(List.of(testPoint));

            // Act
            List<PointObjectResponse> result = service.findAll();

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should return empty list when no point objects")
        void findAll_empty() {
            // Arrange
            when(repository.findAll()).thenReturn(Collections.emptyList());

            // Act
            List<PointObjectResponse> result = service.findAll();

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should find by ObjectType")
        void findByObjectType_success() {
            // Arrange
            when(repository.findByObjectType(ObjectType.BUOY)).thenReturn(List.of(testPoint));

            // Act
            List<PointObjectResponse> result = service.findByObjectType(ObjectType.BUOY);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find by Status")
        void findByStatus_success() {
            // Arrange
            when(repository.findByStatus(Status.PUBLISHED)).thenReturn(List.of(testPoint));

            // Act
            List<PointObjectResponse> result = service.findByStatus(Status.PUBLISHED);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should search with name and code filters")
        void search_success() {
            // Arrange
            when(repository.searchFiltered("Cai", "PORT-CM", ObjectType.PORT, Status.DRAFT))
                    .thenReturn(List.of(testPoint));

            // Act
            List<PointObjectResponse> result = service.search("Cai", "PORT-CM", ObjectType.PORT, Status.DRAFT);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should return empty list when no search matches")
        void search_noMatches_returnsEmpty() {
            // Arrange
            when(repository.searchFiltered(anyString(), anyString(), any(), any()))
                    .thenReturn(Collections.emptyList());

            // Act
            List<PointObjectResponse> result = service.search("", "", null, null);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ==================== UPDATE TESTS ====================

    @Nested
    @DisplayName("Update PointObject")
    class UpdateTests {

        @Test
        @DisplayName("Should update name and description")
        void update_nameAndDescription_success() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setName("Old Name");

            UpdatePointObjectRequest request = UpdatePointObjectRequest.builder()
                    .name("New Port Name")
                    .description("Updated description")
                    .build();

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);

            // Act
            PointObjectResponse result = service.update(testPoint.getId(), request);

            // Assert
            assertNotNull(result);
            assertEquals("New Port Name", result.getName());
            verify(repository).save(any(PointObject.class));
        }

        @Test
        @DisplayName("Should update coordinates with WGS84 validation")
        void update_coordinates_validated() {
            // Arrange
            PointObject existing = newPointEntity();

            UpdatePointObjectRequest request = UpdatePointObjectRequest.builder()
                    .longitude(106.5)
                    .latitude(10.0)
                    .build();

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);

            // Act
            PointObjectResponse result = service.update(testPoint.getId(), request);

            // Assert
            assertNotNull(result);
            verify(repository).save(any(PointObject.class));
        }

        @Test
        @DisplayName("Should throw when updating coordinates out of WGS84 range")
        void update_invalidCoordinates_throws() {
            // Arrange
            PointObject existing = newPointEntity();

            UpdatePointObjectRequest request = UpdatePointObjectRequest.builder()
                    .longitude(200.0)
                    .latitude(10.0)
                    .build();

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));

            // Act & Assert
            assertThrows(IllegalArgumentException.class,
                    () -> service.update(testPoint.getId(), request));
        }

        @Test
        @DisplayName("Should throw when point not found for update")
        void update_notFound_throws() {
            // Arrange
            UpdatePointObjectRequest request = UpdatePointObjectRequest.builder()
                    .name("Nonexistent")
                    .build();

            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(EntityNotFoundException.class,
                    () -> service.update(UUID.randomUUID(), request));
        }

        @Test
        @DisplayName("Should update partial fields only")
        void update_partial_success() {
            // Arrange
            PointObject existing = newPointEntity();

            UpdatePointObjectRequest request = UpdatePointObjectRequest.builder()
                    .objectType(ObjectType.LIGHTHOUSE)
                    .build();

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);

            // Act
            PointObjectResponse result = service.update(testPoint.getId(), request);

            // Assert
            assertNotNull(result);
            verify(repository).save(any(PointObject.class));
        }

        @Test
        @DisplayName("Should update status field")
        void update_status_success() {
            // Arrange
            PointObject existing = newPointEntity();

            UpdatePointObjectRequest request = UpdatePointObjectRequest.builder()
                    .status(Status.PUBLISHED)
                    .build();

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);

            // Act
            PointObjectResponse result = service.update(testPoint.getId(), request);

            // Assert
            assertNotNull(result);
            verify(repository).save(any(PointObject.class));
        }
    }

    // ==================== DELETE TESTS ====================

    @Nested
    @DisplayName("Delete PointObject")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete point object")
        void delete_success() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.DRAFT);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);

            // Act
            service.delete(testPoint.getId());

            // Assert
            assertEquals(Status.DELETED, existing.getStatus());
            verify(repository).save(existing);
        }

        @Test
        @DisplayName("Should set deletedAt via softDelete")
        void delete_setsDeletedAt() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.DRAFT);
            existing.setDeletedAt(null);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);

            // Act
            service.delete(testPoint.getId());

            // Assert
            assertNotNull(existing.getDeletedAt());
        }

        @Test
        @DisplayName("Should throw when deleting nonexistent point")
        void delete_notFound_throws() {
            // Arrange
            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(EntityNotFoundException.class,
                    () -> service.delete(UUID.randomUUID()));
        }
    }

    // ==================== APPROVAL WORKFLOW TESTS ====================

    @Nested
    @DisplayName("Approval Workflow")
    class ApprovalTests {

        @Test
        @DisplayName("Should submit for approval: DRAFT -> PENDING_APPROVAL")
        void submitForApproval_success() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.DRAFT);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);

            // Act
            service.submitForApproval(testPoint.getId());

            // Assert
            assertEquals(Status.PENDING_APPROVAL, existing.getStatus());
            verify(repository).save(existing);
        }

        @Test
        @DisplayName("Should approve L1: PENDING_APPROVAL -> APPROVED_L1")
        void approveL1_success() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.PENDING_APPROVAL);
            existing.setApprovalStatus(ApprovalStatus.PENDING);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);
            when(historyRepository.save(any(PointHistory.class))).thenReturn(PointHistory.builder().build());

            // Act
            PointObjectResponse result = service.approveL1(testPoint.getId(), "1");

            // Assert
            assertNotNull(result);
            assertEquals(Status.APPROVED_L1, existing.getStatus());
            assertEquals(ApprovalStatus.APPROVED, existing.getApprovalStatus());
            assertEquals(Long.valueOf(1L), existing.getApprovedBy());
            assertNotNull(existing.getApprovedDate());
            verify(repository).save(existing);
            verify(historyRepository).save(any(PointHistory.class));
        }

        @Test
        @DisplayName("Should log history on L1 approval")
        void approveL1_logsHistory() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.PENDING_APPROVAL);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);
            when(historyRepository.save(any(PointHistory.class))).thenReturn(PointHistory.builder().build());

            // Act
            service.approveL1(testPoint.getId(), "42");

            // Assert
            verify(historyRepository).save(argThat(h ->
                h.getActionType() == PointHistory.ActionType.APPROVE
            ));
        }

        @Test
        @DisplayName("Should throw L1 approval when not PENDING_APPROVAL")
        void approveL1_wrongStatus_throws() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.DRAFT);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));

            // Act & Assert
            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.approveL1(testPoint.getId(), "1"));
            assertTrue(ex.getMessage().contains("PENDING_APPROVAL"));
        }

        @Test
        @DisplayName("Should approve L2: APPROVED_L1 -> PUBLISHED")
        void approveL2_success() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.APPROVED_L1);
            existing.setApprovedBy(1L);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);
            when(historyRepository.save(any(PointHistory.class))).thenReturn(PointHistory.builder().build());

            // Act
            PointObjectResponse result = service.approveL2(testPoint.getId(), "2");

            // Assert
            assertNotNull(result);
            assertEquals(Status.PUBLISHED, existing.getStatus());
            assertEquals(Long.valueOf(2L), existing.getApprovedBy());
            assertNotNull(existing.getApprovedDate());
            verify(repository).save(existing);
            verify(historyRepository).save(any(PointHistory.class));
        }

        @Test
        @DisplayName("Should log history on L2 approval")
        void approveL2_logsHistory() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.APPROVED_L1);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);
            when(historyRepository.save(any(PointHistory.class))).thenReturn(PointHistory.builder().build());

            // Act
            service.approveL2(testPoint.getId(), "42");

            // Assert
            verify(historyRepository).save(argThat(h ->
                h.getActionType() == PointHistory.ActionType.APPROVE
            ));
        }

        @Test
        @DisplayName("Should throw L2 approval when not APPROVED_L1")
        void approveL2_wrongStatus_throws() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.PENDING_APPROVAL);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));

            // Act & Assert
            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.approveL2(testPoint.getId(), "2"));
            assertTrue(ex.getMessage().contains("APPROVED_L1"));
        }

        @Test
        @DisplayName("Full approval chain: DRAFT -> PENDING -> L1 -> L2")
        void fullApprovalChain_success() {
            // Arrange
            PointObject entity = newPointEntity();
            entity.setStatus(Status.DRAFT);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(entity));
            when(repository.save(any(PointObject.class))).thenAnswer(inv -> entity);
            when(historyRepository.save(any(PointHistory.class))).thenReturn(PointHistory.builder().build());

            // Act - submit approval
            service.submitForApproval(testPoint.getId());
            assertEquals(Status.PENDING_APPROVAL, entity.getStatus());

            // Act - L1
            service.approveL1(testPoint.getId(), "100");
            assertEquals(Status.APPROVED_L1, entity.getStatus());

            // Act - L2
            service.approveL2(testPoint.getId(), "200");
            assertEquals(Status.PUBLISHED, entity.getStatus());

            // Assert
            verify(repository, times(3)).save(any(PointObject.class));
            verify(historyRepository, times(2)).save(any(PointHistory.class));
        }

        @Test
        @DisplayName("Should throw when approving nonexistent point")
        void approve_nonexistent_throws() {
            // Arrange
            when(repository.findById(any(UUID.class))).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(EntityNotFoundException.class,
                    () -> service.approveL1(UUID.randomUUID(), "1"));
            assertThrows(EntityNotFoundException.class,
                    () -> service.approveL2(UUID.randomUUID(), "1"));
        }

        @Test
        @DisplayName("submitForApproval sets approvalStatus to PENDING")
        void submitForApproval_setsApprovalStatus() {
            // Arrange
            PointObject existing = newPointEntity();
            existing.setStatus(Status.DRAFT);
            existing.setApprovalStatus(ApprovalStatus.PENDING);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(existing));
            when(repository.save(any(PointObject.class))).thenReturn(existing);

            // Act
            service.submitForApproval(testPoint.getId());

            // Assert
            assertEquals(com.hanghai.kchtg.gis.point.entity.PointObject.ApprovalStatus.PENDING,
                    existing.getApprovalStatus());
        }
    }

    // ==================== STATUS TRANSITION TESTS ====================

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("DRAFT can transition to PENDING_APPROVAL via submitForApproval")
        void draftToPending_success() {
            PointObject entity = newPointEntity();
            entity.setStatus(Status.DRAFT);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(entity));
            when(repository.save(any(PointObject.class))).thenReturn(entity);

            service.submitForApproval(testPoint.getId());
            assertEquals(Status.PENDING_APPROVAL, entity.getStatus());
        }

        @Test
        @DisplayName("PENDING_APPROVAL can transition to APPROVED_L1 via approveL1")
        void pendingToApprovedL1_success() {
            PointObject entity = newPointEntity();
            entity.setStatus(Status.PENDING_APPROVAL);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(entity));
            when(repository.save(any(PointObject.class))).thenReturn(entity);
            when(historyRepository.save(any(PointHistory.class))).thenReturn(PointHistory.builder().build());

            service.approveL1(testPoint.getId(), "1");
            assertEquals(Status.APPROVED_L1, entity.getStatus());
        }

        @Test
        @DisplayName("APPROVED_L1 can transition to PUBLISHED via approveL2")
        void approvedL1ToPublished_success() {
            PointObject entity = newPointEntity();
            entity.setStatus(Status.APPROVED_L1);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(entity));
            when(repository.save(any(PointObject.class))).thenReturn(entity);
            when(historyRepository.save(any(PointHistory.class))).thenReturn(PointHistory.builder().build());

            service.approveL2(testPoint.getId(), "2");
            assertEquals(Status.PUBLISHED, entity.getStatus());
        }

        @Test
        @DisplayName("DELETED status blocks approval operations")
        void deletedBlocksApproval() {
            PointObject entity = newPointEntity();
            entity.setStatus(Status.DELETED);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(entity));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.approveL1(testPoint.getId(), "1"));
            assertTrue(ex.getMessage().contains("PENDING_APPROVAL"));
        }

        @Test
        @DisplayName("PUBLISHED blocks L1 approval")
        void publishedBlocksL1Approval() {
            PointObject entity = newPointEntity();
            entity.setStatus(Status.PUBLISHED);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(entity));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.approveL1(testPoint.getId(), "1"));
            assertTrue(ex.getMessage().contains("PENDING_APPROVAL"));
        }

        @Test
        @DisplayName("PUBLISHED blocks L2 approval")
        void publishedBlocksL2Approval() {
            PointObject entity = newPointEntity();
            entity.setStatus(Status.PUBLISHED);

            when(repository.findById(testPoint.getId())).thenReturn(Optional.of(entity));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.approveL2(testPoint.getId(), "2"));
            assertTrue(ex.getMessage().contains("APPROVED_L1"));
        }
    }
}

