package com.hanghai.kchtg.beacon;

import com.hanghai.kchtg.beacon.dto.beacon_light.BeaconLightResponse;
import com.hanghai.kchtg.beacon.dto.beacon_light.CreateBeaconLightRequest;
import com.hanghai.kchtg.beacon.dto.beacon_light.UpdateBeaconLightRequest;
import com.hanghai.kchtg.beacon.entity.*;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.beacon.service.BeaconLightService;
import com.hanghai.kchtg.beacon.service.NotificationService;
import com.hanghai.kchtg.beacon.service.PointObjectSyncService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BeaconLightServiceTest {

    @Mock
    private BeaconLightRepository beaconLightRepo;
    @Mock
    private BuoyRepository buoyRepo;
    @Mock
    private BeaconHistoryRepository historyRepo;
    @Mock
    private PointObjectSyncService pointObjectSyncService;
    @Mock
    private NotificationService notificationService;
    @Spy
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @InjectMocks
    private BeaconLightService service;

    private BeaconLight testBeacon;
    private UUID testId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testBeacon = BeaconLight.builder()
                .code("DB-HAUI-001")
                .name("Cai Mep Lighthouse")
                .type(BeaconLightType.LIGHTHOUSE)
                .latitude(10.55)
                .longitude(107.05)
                .lightRange(15.0)
                .lightColor("RED")
                .lightCharacteristic("FL")
                .range(20.0)
                .description("Cai Mep main lighthouse")
                .unitId(1L)
                .lastMaintenanceDate(LocalDate.of(2026, 1, 15))
                .nextMaintenanceDate(LocalDate.of(2026, 7, 15))
                .isActive(true)
                .status(BeaconStatus.DRAFT)
                .approvalStatus(BeaconApprovalStatus.PENDING)
                .build();
        testBeacon.setId(testId);
        testBeacon.setCreatedAt(LocalDateTime.now());
        testBeacon.setUpdatedAt(LocalDateTime.now());
    }

    // ==================== READ TESTS ====================

    @Nested
    @DisplayName("Read BeaconLight")
    class ReadTests {

        @Test
        @DisplayName("Should find all beacon lights")
        void findAll_success() {
            when(beaconLightRepo.findAll()).thenReturn(List.of(testBeacon));
            List<BeaconLightResponse> result = service.findAll();
            assertEquals(1, result.size());
            assertEquals("DB-HAUI-001", result.get(0).getCode());
        }

        @Test
        @DisplayName("Should find by ID")
        void findById_success() {
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            BeaconLightResponse result = service.findById(testId);
            assertNotNull(result);
            assertEquals("DB-HAUI-001", result.getCode());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when not found by ID")
        void findById_notFound() {
            when(beaconLightRepo.findById(any(UUID.class))).thenReturn(Optional.empty());
            assertThrows(EntityNotFoundException.class, () -> service.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should search with filters")
        void search_success() {
            when(beaconLightRepo.searchFiltered("Cai", "DB-HAUI", BeaconLightType.LIGHTHOUSE, BeaconStatus.DRAFT))
                    .thenReturn(List.of(testBeacon));
            List<BeaconLightResponse> result = service.search("Cai", "DB-HAUI", BeaconLightType.LIGHTHOUSE, BeaconStatus.DRAFT);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should return empty list when no search matches")
        void search_noMatches() {
            when(beaconLightRepo.searchFiltered(null, null, null, null)).thenReturn(Collections.emptyList());
            assertTrue(service.search(null, null, null, null).isEmpty());
        }
    }

    // ==================== CREATE TESTS ====================

    @Nested
    @DisplayName("Create BeaconLight")
    class CreateTests {

        @Test
        @DisplayName("Should create BeaconLight with action=draft")
        void create_draft_success() {
            CreateBeaconLightRequest request = CreateBeaconLightRequest.builder()
                    .code("DB-NEW-001")
                    .name("New Lighthouse")
                    .type(BeaconLightType.LIGHTHOUSE)
                    .latitude(10.0)
                    .longitude(107.0)
                    .lightRange(25.0)
                    .lightColor("WHITE")
                    .range(30.0)
                    .description("Test")
                    .unitId(2L)
                    .action("draft")
                    .build();

            when(beaconLightRepo.existsByCode("DB-NEW-001")).thenReturn(false);
            when(buoyRepo.existsByCode("DB-NEW-001")).thenReturn(false);
            when(beaconLightRepo.save(any(BeaconLight.class))).thenAnswer(inv -> {
                BeaconLight e = inv.getArgument(0);
                e.setId(testId);
                return e;
            });

            BeaconLightResponse result = service.create(request);
            assertNotNull(result);
            assertEquals(BeaconStatus.DRAFT, result.getStatus());
            verify(beaconLightRepo).save(any(BeaconLight.class));
            verify(historyRepo).save(any(BeaconHistory.class));
        }

        @Test
        @DisplayName("Should create with action=submit → PENDING_APPROVAL")
        void create_submit_success() {
            CreateBeaconLightRequest request = CreateBeaconLightRequest.builder()
                    .code("DB-SUBMIT-001")
                    .name("Submit Beacon")
                    .type(BeaconLightType.BEACON_LIGHT)
                    .latitude(11.0)
                    .longitude(106.0)
                    .lightRange(20.0)
                    .action("submit")
                    .build();

            when(beaconLightRepo.existsByCode("DB-SUBMIT-001")).thenReturn(false);
            when(buoyRepo.existsByCode("DB-SUBMIT-001")).thenReturn(false);
            when(beaconLightRepo.save(any(BeaconLight.class))).thenAnswer(inv -> {
                BeaconLight e = inv.getArgument(0);
                e.setId(testId);
                return e;
            });

            BeaconLightResponse result = service.create(request);
            assertEquals(BeaconStatus.PENDING_APPROVAL, result.getStatus());
            assertEquals(Integer.valueOf(1), result.getApprovalLevel());
        }

        @Test
        @DisplayName("Should throw on duplicate code in beacon_light")
        void create_duplicateCode_beaconLight() {
            CreateBeaconLightRequest request = CreateBeaconLightRequest.builder()
                    .code("DB-DUP")
                    .name("Dup")
                    .type(BeaconLightType.BEACON_MARK)
                    .latitude(10.0)
                    .longitude(107.0)
                    .lightRange(10.0)
                    .build();

            when(beaconLightRepo.existsByCode("DB-DUP")).thenReturn(true);
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.create(request));
            assertTrue(ex.getMessage().contains("đã tồn tại"));
            verify(beaconLightRepo, never()).save(any());
        }

        @Test
        @DisplayName("Should throw on duplicate code in buoy (cross-type)")
        void create_duplicateCode_buoy() {
            CreateBeaconLightRequest request = CreateBeaconLightRequest.builder()
                    .code("BUOY-EXIST")
                    .name("Dup")
                    .type(BeaconLightType.LIGHTHOUSE)
                    .latitude(10.0)
                    .longitude(107.0)
                    .lightRange(10.0)
                    .build();

            when(beaconLightRepo.existsByCode("BUOY-EXIST")).thenReturn(false);
            when(buoyRepo.existsByCode("BUOY-EXIST")).thenReturn(true);
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(beaconLightRepo, never()).save(any());
        }

        @Test
        @DisplayName("Should throw on latitude < -90")
        void create_invalidLatitude_negative() {
            CreateBeaconLightRequest request = new CreateBeaconLightRequest();
            request.setCode("DB-BAD");
            request.setName("Bad");
            request.setType(BeaconLightType.LIGHTHOUSE);
            request.setLatitude(-91.0);
            request.setLongitude(107.0);
            request.setLightRange(10.0);

            when(beaconLightRepo.existsByCode("DB-BAD")).thenReturn(false);
            when(buoyRepo.existsByCode("DB-BAD")).thenReturn(false);
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(beaconLightRepo, never()).save(any());
        }

        @Test
        @DisplayName("Should throw on longitude > 180")
        void create_invalidLongitude_positive() {
            CreateBeaconLightRequest request = new CreateBeaconLightRequest();
            request.setCode("DB-BAD");
            request.setName("Bad");
            request.setType(BeaconLightType.LIGHTHOUSE);
            request.setLatitude(10.0);
            request.setLongitude(181.0);
            request.setLightRange(10.0);

            when(beaconLightRepo.existsByCode("DB-BAD")).thenReturn(false);
            when(buoyRepo.existsByCode("DB-BAD")).thenReturn(false);
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
        }

        @Test
        @DisplayName("Should accept boundary coordinates (-180/-90)")
        void create_boundaryCoordinates() {
            CreateBeaconLightRequest request = new CreateBeaconLightRequest();
            request.setCode("DB-BOUND");
            request.setName("Boundary");
            request.setType(BeaconLightType.LIGHTHOUSE);
            request.setLatitude(-90.0);
            request.setLongitude(180.0);
            request.setLightRange(0.01);

            when(beaconLightRepo.existsByCode("DB-BOUND")).thenReturn(false);
            when(buoyRepo.existsByCode("DB-BOUND")).thenReturn(false);
            when(beaconLightRepo.save(any(BeaconLight.class))).thenAnswer(inv -> inv.getArgument(0));

            BeaconLightResponse result = service.create(request);
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should throw on lightRange < 0.01")
        void create_lightRangeTooSmall() {
            CreateBeaconLightRequest request = new CreateBeaconLightRequest();
            request.setCode("DB-BAD");
            request.setName("Bad");
            request.setType(BeaconLightType.LIGHTHOUSE);
            request.setLatitude(10.0);
            request.setLongitude(107.0);
            request.setLightRange(0.001);

            when(beaconLightRepo.existsByCode("DB-BAD")).thenReturn(false);
            when(buoyRepo.existsByCode("DB-BAD")).thenReturn(false);
            assertThrows(Exception.class, () -> service.create(request));
        }

        @Test
        @DisplayName("Should throw on lightRange > 60.0")
        void create_lightRangeTooLarge() {
            CreateBeaconLightRequest request = new CreateBeaconLightRequest();
            request.setCode("DB-BAD");
            request.setName("Bad");
            request.setType(BeaconLightType.LIGHTHOUSE);
            request.setLatitude(10.0);
            request.setLongitude(107.0);
            request.setLightRange(61.0);

            when(beaconLightRepo.existsByCode("DB-BAD")).thenReturn(false);
            when(buoyRepo.existsByCode("DB-BAD")).thenReturn(false);
            assertThrows(Exception.class, () -> service.create(request));
        }
    }

    // ==================== UPDATE TESTS ====================

    @Nested
    @DisplayName("Update BeaconLight")
    class UpdateTests {

        @Test
        @DisplayName("Should update name and color")
        void update_success() {
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .name("Updated Lighthouse")
                    .lightColor("GREEN")
                    .build();

            BeaconLightResponse result = service.update(testId, request);
            assertEquals("Updated Lighthouse", result.getName());
            assertEquals("GREEN", result.getLightColor());
            verify(beaconLightRepo).save(testBeacon);
            verify(historyRepo, times(1)).save(any(BeaconHistory.class));
        }

        @Test
        @DisplayName("Should throw on DELETED entity")
        void update_deletedEntity_throws() {
            BeaconLight deleted = new BeaconLight();
            deleted.setId(testId);
            deleted.setStatus(BeaconStatus.DELETED);

            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(deleted));
            assertThrows(EntityNotFoundException.class, () -> service.update(testId, new UpdateBeaconLightRequest()));
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when not found")
        void update_notFound_throws() {
            when(beaconLightRepo.findById(any(UUID.class))).thenReturn(Optional.empty());
            assertThrows(EntityNotFoundException.class, () -> service.update(UUID.randomUUID(), new UpdateBeaconLightRequest()));
        }

        @Test
        @DisplayName("Should revert status from PUBLISHED → DRAFT")
        void update_publishedRevertsToDraft() {
            testBeacon.setStatus(BeaconStatus.PUBLISHED);
            testBeacon.setApprovalStatus(BeaconApprovalStatus.APPROVED);

            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .name("Reverted Name")
                    .build();

            BeaconLightResponse result = service.update(testId, request);
            assertEquals(BeaconStatus.DRAFT, result.getStatus());
            assertEquals(BeaconApprovalStatus.PENDING, result.getApprovalStatus());
            assertEquals(Integer.valueOf(1), result.getApprovalLevel());
        }

        @Test
        @DisplayName("Should revert status from APPROVED_L1 → DRAFT")
        void update_approvedL1RevertsToDraft() {
            testBeacon.setStatus(BeaconStatus.APPROVED_L1);

            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            UpdateBeaconLightRequest request = new UpdateBeaconLightRequest();
            BeaconLightResponse result = service.update(testId, request);
            assertEquals(BeaconStatus.DRAFT, result.getStatus());
        }

        @Test
        @DisplayName("Should NOT revert PENDING_APPROVAL on update")
        void update_pendingStaysPending() {
            testBeacon.setStatus(BeaconStatus.PENDING_APPROVAL);

            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .name("Still Pending")
                    .build();

            BeaconLightResponse result = service.update(testId, request);
            assertEquals(BeaconStatus.PENDING_APPROVAL, result.getStatus());
        }

        @Test
        @DisplayName("Should skip history log when no actual changes")
        void update_noChanges_skipHistory() {
            // Same values — oldJson equals newJson
            testBeacon.setName("Same Name");
            testBeacon.setLightColor("RED");
            testBeacon.setRange(20.0);
            testBeacon.setDescription("Same desc");
            testBeacon.setUnitId(1L);
            testBeacon.setIsActive(true);

            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .name("Same Name")
                    .lightColor("RED")
                    .range(20.0)
                    .description("Same desc")
                    .unitId(1L)
                    .isActive(true)
                    .build();

            service.update(testId, request);
            // History should not be saved because JSON unchanged
            verify(historyRepo, never()).save(any(BeaconHistory.class));
        }

        @Test
        @DisplayName("Should successfully update type, latitude, and longitude when DRAFT")
        void update_typeAndCoordinates_success() {
            testBeacon.setStatus(BeaconStatus.DRAFT);
            testBeacon.setType(BeaconLightType.BEACON_LIGHT);
            testBeacon.setLatitude(10.0);
            testBeacon.setLongitude(100.0);

            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .type(BeaconLightType.LIGHTHOUSE)
                    .latitude(20.0)
                    .longitude(110.0)
                    .build();

            BeaconLightResponse result = service.update(testId, request);
            assertEquals(BeaconLightType.LIGHTHOUSE, result.getType());
            assertEquals(Double.valueOf(20.0), result.getLatitude());
            assertEquals(Double.valueOf(110.0), result.getLongitude());
            verify(beaconLightRepo).save(testBeacon);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when updating type on PUBLISHED entity")
        void update_typeOnPublished_throws() {
            testBeacon.setStatus(BeaconStatus.PUBLISHED);
            testBeacon.setType(BeaconLightType.BEACON_LIGHT);

            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .type(BeaconLightType.LIGHTHOUSE)
                    .build();

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.update(testId, request));
            assertEquals("Loại đèn biển không thể thay đổi khi đèn biển đã được phê duyệt.", ex.getMessage());
            verify(beaconLightRepo, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when coordinate is invalid")
        void update_invalidCoordinates_throws() {
            testBeacon.setStatus(BeaconStatus.DRAFT);

            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .latitude(95.0)
                    .build();

            assertThrows(IllegalArgumentException.class, () -> service.update(testId, request));
            verify(beaconLightRepo, never()).save(any());
        }
    }

    // ==================== DELETE TESTS ====================

    @Nested
    @DisplayName("Delete BeaconLight")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete successfully")
        void delete_success() {
            testBeacon.setStatus(BeaconStatus.DRAFT);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            service.delete(testId);

            assertEquals(BeaconStatus.DELETED, testBeacon.getStatus());
            assertNotNull(testBeacon.getDeletedAt());
            verify(beaconLightRepo).save(testBeacon);
            verify(historyRepo).save(any(BeaconHistory.class));
            verify(pointObjectSyncService).hideFromMap(any(BeaconLight.class));
        }

        @Test
        @DisplayName("Should throw on already deleted entity")
        void delete_alreadyDeleted_throws() {
            testBeacon.setStatus(BeaconStatus.DELETED);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            assertThrows(IllegalArgumentException.class, () -> service.delete(testId));
        }

        @Test
        @DisplayName("Should throw on entity in approval process")
        void delete_inApprovalProcess_throws() {
            testBeacon.setStatus(BeaconStatus.PENDING_APPROVAL);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            assertThrows(IllegalStateException.class, () -> service.delete(testId));
        }

        @Test
        @DisplayName("Should throw APPROVED_L1 in approval process")
        void delete_approvedL1_throws() {
            testBeacon.setStatus(BeaconStatus.APPROVED_L1);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            assertThrows(IllegalStateException.class, () -> service.delete(testId));
        }

        @Test
        @DisplayName("Should throw APPROVED_L2 in approval process")
        void delete_approvedL2_throws() {
            testBeacon.setStatus(BeaconStatus.APPROVED_L2);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            assertThrows(IllegalStateException.class, () -> service.delete(testId));
        }

        @Test
        @DisplayName("Should throw when not found")
        void delete_notFound_throws() {
            when(beaconLightRepo.findById(any(UUID.class))).thenReturn(Optional.empty());
            assertThrows(EntityNotFoundException.class, () -> service.delete(UUID.randomUUID()));
        }
    }

    // ==================== APPROVAL WORKFLOW TESTS ====================

    @Nested
    @DisplayName("Approval Workflow")
    class ApprovalTests {

        @Test
        @DisplayName("Should submit for approval: DRAFT → PENDING_APPROVAL")
        void submit_success() {
            testBeacon.setStatus(BeaconStatus.DRAFT);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            service.submitForApproval(testId);

            assertEquals(BeaconStatus.PENDING_APPROVAL, testBeacon.getStatus());
            assertEquals(BeaconApprovalStatus.PENDING, testBeacon.getApprovalStatus());
            assertEquals(Integer.valueOf(1), testBeacon.getApprovalLevel());
            verify(notificationService).sendApprovalNotification(testBeacon);
        }

        @Test
        @DisplayName("Should throw when submitting non-DRAFT entity")
        void submit_nonDraft_throws() {
            testBeacon.setStatus(BeaconStatus.APPROVED_L1);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            assertThrows(IllegalStateException.class, () -> service.submitForApproval(testId));
        }

        @Test
        @DisplayName("Should approve L1: PENDING_APPROVAL → APPROVED_L1")
        void approveL1_success() {
            testBeacon.setStatus(BeaconStatus.PENDING_APPROVAL);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            BeaconLightResponse result = service.approveL1(testId, "42");

            assertEquals(BeaconStatus.APPROVED_L1, result.getStatus());
            assertEquals(BeaconApprovalStatus.APPROVED, result.getApprovalStatus());
            assertEquals(Long.valueOf(42L), result.getApprovedBy());
            assertNotNull(result.getApprovedDate());
            verify(historyRepo).save(any(BeaconHistory.class));
            verify(notificationService).sendL2ApprovalNotification(testBeacon);
        }

        @Test
        @DisplayName("Should prevent self-approval at L1")
        void approveL1_selfApproval_prevented() {
            testBeacon.setStatus(BeaconStatus.PENDING_APPROVAL);
            testBeacon.setApprovedBy(42L); // creatorId == approverId
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            assertThrows(IllegalStateException.class, () -> service.approveL1(testId, "42"));
        }

        @Test
        @DisplayName("Should throw L1 when not PENDING_APPROVAL")
        void approveL1_wrongStatus_throws() {
            testBeacon.setStatus(BeaconStatus.DRAFT);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            assertThrows(IllegalStateException.class, () -> service.approveL1(testId, "1"));
        }

        @Test
        @DisplayName("Should approve L2: APPROVED_L1 → PUBLISHED")
        void approveL2_success() {
            testBeacon.setStatus(BeaconStatus.APPROVED_L1);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            BeaconLightResponse result = service.approveL2(testId, "100");

            assertEquals(BeaconStatus.PUBLISHED, result.getStatus());
            assertEquals(BeaconApprovalStatus.APPROVED, result.getApprovalStatus());
            assertEquals(Long.valueOf(100L), result.getApprovedBy());
            assertNotNull(result.getApprovedDate());
            verify(historyRepo).save(any(BeaconHistory.class));
            verify(pointObjectSyncService).syncToMap(any(BeaconLight.class));
        }

        @Test
        @DisplayName("Should throw L2 when not APPROVED_L1")
        void approveL2_wrongStatus_throws() {
            testBeacon.setStatus(BeaconStatus.PENDING_APPROVAL);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            assertThrows(IllegalStateException.class, () -> service.approveL2(testId, "2"));
        }

        @Test
        @DisplayName("Should reject with reason (min 10 chars)")
        void reject_success() {
            testBeacon.setStatus(BeaconStatus.PENDING_APPROVAL);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenReturn(testBeacon);

            BeaconLightResponse result = service.reject(testId, "Không đạt yêu cầu kỹ thuật", "42");

            assertEquals(BeaconStatus.DRAFT, result.getStatus());
            assertEquals(BeaconApprovalStatus.REJECTED, result.getApprovalStatus());
            assertEquals("Không đạt yêu cầu kỹ thuật", result.getRejectionReason());
            verify(historyRepo).save(any(BeaconHistory.class));
            verify(notificationService).sendRejectionNotification(any(), eq("Không đạt yêu cầu kỹ thuật"));
        }

        @Test
        @DisplayName("Should throw when reject reason < 10 chars")
        void reject_shortReason_throws() {
            testBeacon.setStatus(BeaconStatus.APPROVED_L1);
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));

            assertThrows(IllegalArgumentException.class, () -> service.reject(testId, "Too short", "1"));
        }

        @Test
        @DisplayName("Full chain: DRAFT → PENDING → L1 → L2 → PUBLISHED")
        void fullApprovalChain_success() {
            when(beaconLightRepo.findById(testId)).thenReturn(Optional.of(testBeacon));
            when(beaconLightRepo.save(any(BeaconLight.class))).thenAnswer(inv -> testBeacon);

            // Submit
            service.submitForApproval(testId);
            assertEquals(BeaconStatus.PENDING_APPROVAL, testBeacon.getStatus());

            // L1
            service.approveL1(testId, "100");
            assertEquals(BeaconStatus.APPROVED_L1, testBeacon.getStatus());

            // L2
            service.approveL2(testId, "200");
            assertEquals(BeaconStatus.PUBLISHED, testBeacon.getStatus());

            verify(beaconLightRepo, times(3)).save(any(BeaconLight.class));
        }
    }

    // ==================== VALIDATION TESTS ====================

    @Nested
    @DisplayName("Validation Rules")
    class ValidationTests {

        @Test
        @DisplayName("Should throw on coordinates out of range")
        void validateCoordinates_outOfBounds() {
            CreateBeaconLightRequest request = new CreateBeaconLightRequest();
            request.setCode("DB-BAD");
            request.setName("Bad");
            request.setType(BeaconLightType.LIGHTHOUSE);
            request.setLatitude(91.0);
            request.setLongitude(107.0);
            request.setLightRange(10.0);

            when(beaconLightRepo.existsByCode("DB-BAD")).thenReturn(false);
            when(buoyRepo.existsByCode("DB-BAD")).thenReturn(false);
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
        }

        @Test
        @DisplayName("Should throw on maintenance date: next < last")
        void validateMaintenance_datesInvalid() {
            CreateBeaconLightRequest request = new CreateBeaconLightRequest();
            request.setCode("DB-BAD");
            request.setName("Bad");
            request.setType(BeaconLightType.LIGHTHOUSE);
            request.setLatitude(10.0);
            request.setLongitude(107.0);
            request.setLightRange(10.0);
            request.setLastMaintenanceDate(LocalDate.of(2026, 12, 1));
            request.setNextMaintenanceDate(LocalDate.of(2026, 6, 1));

            when(beaconLightRepo.existsByCode("DB-BAD")).thenReturn(false);
            when(buoyRepo.existsByCode("DB-BAD")).thenReturn(false);
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
        }

        @Test
        @DisplayName("All BeaconLightType enum values accepted")
        void create_withAllTypes() {
            for (BeaconLightType type : BeaconLightType.values()) {
                CreateBeaconLightRequest request = new CreateBeaconLightRequest();
                request.setCode("DB-" + type.name());
                request.setName(type.name());
                request.setType(type);
                request.setLatitude(10.0);
                request.setLongitude(107.0);
                request.setLightRange(10.0);

                when(beaconLightRepo.existsByCode("DB-" + type.name())).thenReturn(false);
                when(buoyRepo.existsByCode("DB-" + type.name())).thenReturn(false);
                when(beaconLightRepo.save(any(BeaconLight.class))).thenAnswer(inv -> inv.getArgument(0));

                BeaconLightResponse result = service.create(request);
                assertNotNull(result);
                assertEquals(type, result.getType());
            }
        }
    }
}
