package com.hanghai.kchtg.beacon;

import com.hanghai.kchtg.beacon.dto.buoy.BuoyResponse;
import com.hanghai.kchtg.beacon.dto.buoy.CreateBuoyRequest;
import com.hanghai.kchtg.beacon.dto.buoy.UpdateBuoyRequest;
import com.hanghai.kchtg.beacon.entity.*;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.beacon.service.BuoyService;
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
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BuoyServiceTest {

    @Mock
    private BuoyRepository buoyRepo;
    @Mock
    private BeaconLightRepository beaconLightRepo;
    @Mock
    private BeaconHistoryRepository historyRepo;
    @Mock
    private PointObjectSyncService pointObjectSyncService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BuoyService service;

    private Buoy testBuoy;
    private UUID testId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testBuoy = Buoy.builder()
                .code("PT-HAUI-001")
                .name("Cai Mep Cardinal Buoy")
                .type(BuoyType.CARDINAL)
                .latitude(10.55)
                .longitude(107.05)
                .color("RED")
                .shape("CAN")
                .range(30.0)
                .description("Cardinal buoy marking channel")
                .unitId(1L)
                .lastInspectionDate(LocalDate.of(2026, 1, 10))
                .nextInspectionDate(LocalDate.of(2026, 7, 10))
                .isActive(true)
                .status(BeaconStatus.DRAFT)
                .approvalStatus(BeaconApprovalStatus.PENDING)
                .build();
        testBuoy.setId(testId);
        testBuoy.setCreatedAt(LocalDateTime.now());
        testBuoy.setUpdatedAt(LocalDateTime.now());
    }

    // ==================== READ TESTS ====================

    @Nested
    @DisplayName("Read Buoy")
    class ReadTests {

        @Test
        @DisplayName("Should find all buoys")
        void findAll_success() {
            when(buoyRepo.findAll()).thenReturn(List.of(testBuoy));
            List<BuoyResponse> result = service.findAll();
            assertEquals(1, result.size());
            assertEquals("PT-HAUI-001", result.get(0).getCode());
        }

        @Test
        @DisplayName("Should find by ID")
        void findById_success() {
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            BuoyResponse result = service.findById(testId);
            assertNotNull(result);
            assertEquals("PT-HAUI-001", result.getCode());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when not found")
        void findById_notFound() {
            when(buoyRepo.findById(any(UUID.class))).thenReturn(Optional.empty());
            assertThrows(EntityNotFoundException.class, () -> service.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should search with filters")
        void search_success() {
            when(buoyRepo.searchFiltered("Cai", "PT-HAUI", BuoyType.CARDINAL, BeaconStatus.DRAFT))
                    .thenReturn(List.of(testBuoy));
            List<BuoyResponse> result = service.search("Cai", "PT-HAUI", BuoyType.CARDINAL, BeaconStatus.DRAFT);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should return empty on no matches")
        void search_noMatches() {
            when(buoyRepo.searchFiltered(null, null, null, null)).thenReturn(Collections.emptyList());
            assertTrue(service.search(null, null, null, null).isEmpty());
        }
    }

    // ==================== CREATE TESTS ====================

    @Nested
    @DisplayName("Create Buoy")
    class CreateTests {

        @Test
        @DisplayName("Should create buoy with action=draft")
        void create_draft_success() {
            CreateBuoyRequest request = CreateBuoyRequest.builder()
                    .code("PT-NEW-001")
                    .name("New Buoy")
                    .type(BuoyType.SECTOR)
                    .latitude(10.0)
                    .longitude(107.0)
                    .color("GREEN")
                    .shape("CONE")
                    .range(25.0)
                    .unitId(2L)
                    .action("draft")
                    .build();

            when(buoyRepo.existsByCode("PT-NEW-001")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PT-NEW-001")).thenReturn(false);
            when(buoyRepo.save(any(Buoy.class))).thenAnswer(inv -> {
                Buoy e = inv.getArgument(0);
                e.setId(testId);
                return e;
            });

            BuoyResponse result = service.create(request);
            assertNotNull(result);
            assertEquals(BeaconStatus.DRAFT, result.getStatus());
            verify(buoyRepo).save(any(Buoy.class));
            verify(historyRepo).save(any(BeaconHistory.class));
        }

        @Test
        @DisplayName("Should create with action=submit → PENDING_APPROVAL")
        void create_submit_success() {
            CreateBuoyRequest request = CreateBuoyRequest.builder()
                    .code("PT-SUBMIT-001")
                    .name("Submit Buoy")
                    .type(BuoyType.SAFE_WATER)
                    .latitude(11.0)
                    .longitude(106.0)
                    .range(20.0)
                    .action("submit")
                    .build();

            when(buoyRepo.existsByCode("PT-SUBMIT-001")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PT-SUBMIT-001")).thenReturn(false);
            when(buoyRepo.save(any(Buoy.class))).thenAnswer(inv -> {
                Buoy e = inv.getArgument(0);
                e.setId(testId);
                return e;
            });

            BuoyResponse result = service.create(request);
            assertEquals(BeaconStatus.PENDING_APPROVAL, result.getStatus());
            assertEquals(Integer.valueOf(1), result.getApprovalLevel());
        }

        @Test
        @DisplayName("Should throw on duplicate code in buoy")
        void create_duplicateCode_buoy() {
            CreateBuoyRequest request = new CreateBuoyRequest();
            request.setCode("PT-DUP");
            request.setName("Dup");
            request.setType(BuoyType.CARDINAL);
            request.setLatitude(10.0);
            request.setLongitude(107.0);
            request.setRange(10.0);

            when(buoyRepo.existsByCode("PT-DUP")).thenReturn(true);
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(buoyRepo, never()).save(any());
        }

        @Test
        @DisplayName("Should throw on duplicate code in beacon_light (cross-type)")
        void create_duplicateCode_beaconLight() {
            CreateBuoyRequest request = new CreateBuoyRequest();
            request.setCode("LIGHTHOUSE-CODE");
            request.setName("Dup");
            request.setType(BuoyType.CARDINAL);
            request.setLatitude(10.0);
            request.setLongitude(107.0);
            request.setRange(10.0);

            when(buoyRepo.existsByCode("LIGHTHOUSE-CODE")).thenReturn(false);
            when(beaconLightRepo.existsByCode("LIGHTHOUSE-CODE")).thenReturn(true);
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
        }

        @Test
        @DisplayName("Should throw on latitude out of range")
        void create_invalidLatitude() {
            CreateBuoyRequest request = new CreateBuoyRequest();
            request.setCode("PT-BAD");
            request.setName("Bad");
            request.setType(BuoyType.CARDINAL);
            request.setLatitude(91.0);
            request.setLongitude(107.0);
            request.setRange(10.0);

            when(buoyRepo.existsByCode("PT-BAD")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PT-BAD")).thenReturn(false);
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
        }

        @Test
        @DisplayName("Should throw on longitude out of range")
        void create_invalidLongitude() {
            CreateBuoyRequest request = new CreateBuoyRequest();
            request.setCode("PT-BAD");
            request.setName("Bad");
            request.setType(BuoyType.CARDINAL);
            request.setLatitude(10.0);
            request.setLongitude(181.0);
            request.setRange(10.0);

            when(buoyRepo.existsByCode("PT-BAD")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PT-BAD")).thenReturn(false);
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
        }

        @Test
        @DisplayName("Should throw on range < 0.01")
        void create_rangeTooSmall() {
            CreateBuoyRequest request = new CreateBuoyRequest();
            request.setCode("PT-BAD");
            request.setName("Bad");
            request.setType(BuoyType.CARDINAL);
            request.setLatitude(10.0);
            request.setLongitude(107.0);
            request.setRange(0.001);

            when(buoyRepo.existsByCode("PT-BAD")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PT-BAD")).thenReturn(false);
            assertThrows(Exception.class, () -> service.create(request));
        }

        @Test
        @DisplayName("Should throw on range > 100.0")
        void create_rangeTooLarge() {
            CreateBuoyRequest request = new CreateBuoyRequest();
            request.setCode("PT-BAD");
            request.setName("Bad");
            request.setType(BuoyType.CARDINAL);
            request.setLatitude(10.0);
            request.setLongitude(107.0);
            request.setRange(101.0);

            when(buoyRepo.existsByCode("PT-BAD")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PT-BAD")).thenReturn(false);
            assertThrows(Exception.class, () -> service.create(request));
        }

        @Test
        @DisplayName("Should throw on inspection date: next < last")
        void create_inspectionDatesInvalid() {
            CreateBuoyRequest request = new CreateBuoyRequest();
            request.setCode("PT-BAD");
            request.setName("Bad");
            request.setType(BuoyType.CARDINAL);
            request.setLatitude(10.0);
            request.setLongitude(107.0);
            request.setRange(10.0);
            request.setLastInspectionDate(LocalDate.of(2026, 12, 1));
            request.setNextInspectionDate(LocalDate.of(2026, 6, 1));

            when(buoyRepo.existsByCode("PT-BAD")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PT-BAD")).thenReturn(false);
            assertThrows(IllegalArgumentException.class, () -> service.create(request));
        }

        @Test
        @DisplayName("All BuoyType enum values accepted")
        void create_withAllTypes() {
            for (BuoyType type : BuoyType.values()) {
                CreateBuoyRequest request = new CreateBuoyRequest();
                request.setCode("PT-" + type.name());
                request.setName(type.name());
                request.setType(type);
                request.setLatitude(10.0);
                request.setLongitude(107.0);
                request.setRange(10.0);

                when(buoyRepo.existsByCode("PT-" + type.name())).thenReturn(false);
                when(beaconLightRepo.existsByCode("PT-" + type.name())).thenReturn(false);
                when(buoyRepo.save(any(Buoy.class))).thenAnswer(inv -> inv.getArgument(0));

                BuoyResponse result = service.create(request);
                assertNotNull(result);
                assertEquals(type, result.getType());
            }
        }
    }

    // ==================== UPDATE TESTS ====================

    @Nested
    @DisplayName("Update Buoy")
    class UpdateTests {

        @Test
        @DisplayName("Should update name and color")
        void update_success() {
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenReturn(testBuoy);

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .name("Updated Buoy")
                    .color("WHITE")
                    .shape("BELL")
                    .build();

            BuoyResponse result = service.update(testId, request);
            assertEquals("Updated Buoy", result.getName());
            assertEquals("WHITE", result.getColor());
            verify(buoyRepo).save(testBuoy);
        }

        @Test
        @DisplayName("Should throw on DELETED entity")
        void update_deletedEntity_throws() {
            Buoy deleted = new Buoy();
            deleted.setId(testId);
            deleted.setStatus(BeaconStatus.DELETED);

            when(buoyRepo.findById(testId)).thenReturn(Optional.of(deleted));
            assertThrows(EntityNotFoundException.class, () -> service.update(testId, new UpdateBuoyRequest()));
        }

        @Test
        @DisplayName("Should throw when not found")
        void update_notFound_throws() {
            when(buoyRepo.findById(any(UUID.class))).thenReturn(Optional.empty());
            assertThrows(EntityNotFoundException.class, () -> service.update(UUID.randomUUID(), new UpdateBuoyRequest()));
        }

        @Test
        @DisplayName("Should revert status from PUBLISHED → DRAFT")
        void update_publishedRevertsToDraft() {
            testBuoy.setStatus(BeaconStatus.PUBLISHED);

            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenReturn(testBuoy);

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .name("Reverted Buoy")
                    .build();

            BuoyResponse result = service.update(testId, request);
            assertEquals(BeaconStatus.DRAFT, result.getStatus());
            assertEquals(BeaconApprovalStatus.PENDING, result.getApprovalStatus());
        }

        @Test
        @DisplayName("Should NOT revert PENDING_APPROVAL on update")
        void update_pendingStaysPending() {
            testBuoy.setStatus(BeaconStatus.PENDING_APPROVAL);

            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenReturn(testBuoy);

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .name("Still Pending")
                    .build();

            BuoyResponse result = service.update(testId, request);
            assertEquals(BeaconStatus.PENDING_APPROVAL, result.getStatus());
        }

        @Test
        @DisplayName("Should successfully update type, latitude, and longitude when DRAFT")
        void update_typeAndCoordinates_success() {
            testBuoy.setStatus(BeaconStatus.DRAFT);
            testBuoy.setType(BuoyType.CARDINAL);
            testBuoy.setLatitude(10.0);
            testBuoy.setLongitude(100.0);

            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenReturn(testBuoy);

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .type(BuoyType.SPECIAL)
                    .latitude(20.0)
                    .longitude(110.0)
                    .build();

            BuoyResponse result = service.update(testId, request);
            assertEquals(BuoyType.SPECIAL, result.getType());
            assertEquals(Double.valueOf(20.0), result.getLatitude());
            assertEquals(Double.valueOf(110.0), result.getLongitude());
            verify(buoyRepo).save(testBuoy);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when updating type on PUBLISHED entity")
        void update_typeOnPublished_throws() {
            testBuoy.setStatus(BeaconStatus.PUBLISHED);
            testBuoy.setType(BuoyType.CARDINAL);

            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .type(BuoyType.SPECIAL)
                    .build();

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                    () -> service.update(testId, request));
            assertEquals("Loại phao tiêu không thể thay đổi khi đã được phê duyệt.", ex.getMessage());
            verify(buoyRepo, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when coordinate is invalid")
        void update_invalidCoordinates_throws() {
            testBuoy.setStatus(BeaconStatus.DRAFT);

            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .latitude(95.0)
                    .build();

            assertThrows(IllegalArgumentException.class, () -> service.update(testId, request));
            verify(buoyRepo, never()).save(any());
        }
    }

    // ==================== DELETE TESTS ====================

    @Nested
    @DisplayName("Delete Buoy")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete successfully")
        void delete_success() {
            testBuoy.setStatus(BeaconStatus.DRAFT);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenReturn(testBuoy);

            service.delete(testId);

            assertEquals(BeaconStatus.DELETED, testBuoy.getStatus());
            assertNotNull(testBuoy.getDeletedAt());
            verify(buoyRepo).save(testBuoy);
            verify(historyRepo).save(any(BeaconHistory.class));
            verify(pointObjectSyncService).hideFromMapBuoy(any(Buoy.class));
        }

        @Test
        @DisplayName("Should throw on already deleted")
        void delete_alreadyDeleted_throws() {
            testBuoy.setStatus(BeaconStatus.DELETED);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            assertThrows(IllegalArgumentException.class, () -> service.delete(testId));
        }

        @Test
        @DisplayName("Should throw on entity in approval process")
        void delete_inApprovalProcess_throws() {
            testBuoy.setStatus(BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            assertThrows(IllegalStateException.class, () -> service.delete(testId));
        }

        @Test
        @DisplayName("Should throw when not found")
        void delete_notFound_throws() {
            when(buoyRepo.findById(any(UUID.class))).thenReturn(Optional.empty());
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
            testBuoy.setStatus(BeaconStatus.DRAFT);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenReturn(testBuoy);

            service.submitForApproval(testId);

            assertEquals(BeaconStatus.PENDING_APPROVAL, testBuoy.getStatus());
            verify(notificationService).sendApprovalNotificationBuoy(testBuoy);
        }

        @Test
        @DisplayName("Should throw when submitting non-DRAFT entity")
        void submit_nonDraft_throws() {
            testBuoy.setStatus(BeaconStatus.APPROVED_L1);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            assertThrows(IllegalStateException.class, () -> service.submitForApproval(testId));
        }

        @Test
        @DisplayName("Should approve L1: PENDING_APPROVAL → APPROVED_L1")
        void approveL1_success() {
            testBuoy.setStatus(BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenReturn(testBuoy);

            BuoyResponse result = service.approveL1(testId, "42");
            assertEquals(BeaconStatus.APPROVED_L1, result.getStatus());
            assertEquals(Long.valueOf(42L), result.getApprovedBy());
            verify(notificationService).sendL2ApprovalNotificationBuoy(testBuoy);
        }

        @Test
        @DisplayName("Should prevent self-approval at L1")
        void approveL1_selfApproval_prevented() {
            testBuoy.setStatus(BeaconStatus.PENDING_APPROVAL);
            testBuoy.setApprovedBy(42L);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            assertThrows(IllegalStateException.class, () -> service.approveL1(testId, "42"));
        }

        @Test
        @DisplayName("Should approve L2: APPROVED_L1 → PUBLISHED")
        void approveL2_success() {
            testBuoy.setStatus(BeaconStatus.APPROVED_L1);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenReturn(testBuoy);

            BuoyResponse result = service.approveL2(testId, "100");
            assertEquals(BeaconStatus.PUBLISHED, result.getStatus());
            verify(pointObjectSyncService).syncToMapBuoy(any(Buoy.class));
        }

        @Test
        @DisplayName("Should throw L2 when not APPROVED_L1")
        void approveL2_wrongStatus_throws() {
            testBuoy.setStatus(BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            assertThrows(IllegalStateException.class, () -> service.approveL2(testId, "2"));
        }

        @Test
        @DisplayName("Should reject with reason")
        void reject_success() {
            testBuoy.setStatus(BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenReturn(testBuoy);

            BuoyResponse result = service.reject(testId, "Không đạt yêu cầu kỹ thuật", "42");
            assertEquals(BeaconStatus.DRAFT, result.getStatus());
            assertEquals("Không đạt yêu cầu kỹ thuật", result.getRejectionReason());
            verify(notificationService).sendRejectionNotificationBuoy(any(), eq("Không đạt yêu cầu kỹ thuật"));
        }

        @Test
        @DisplayName("Should throw when reject reason < 10 chars")
        void reject_shortReason_throws() {
            testBuoy.setStatus(BeaconStatus.APPROVED_L1);
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            assertThrows(IllegalArgumentException.class, () -> service.reject(testId, "Too short", "1"));
        }

        @Test
        @DisplayName("Full chain: DRAFT → PENDING → L1 → L2 → PUBLISHED")
        void fullApprovalChain_success() {
            when(buoyRepo.findById(testId)).thenReturn(Optional.of(testBuoy));
            when(buoyRepo.save(any(Buoy.class))).thenAnswer(inv -> testBuoy);

            service.submitForApproval(testId);
            assertEquals(BeaconStatus.PENDING_APPROVAL, testBuoy.getStatus());

            service.approveL1(testId, "100");
            assertEquals(BeaconStatus.APPROVED_L1, testBuoy.getStatus());

            service.approveL2(testId, "200");
            assertEquals(BeaconStatus.PUBLISHED, testBuoy.getStatus());

            verify(buoyRepo, times(3)).save(any(Buoy.class));
        }
    }
}
