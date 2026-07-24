package com.hanghai.kchtg.beacon;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hanghai.kchtg.beacon.dto.buoy.BuoyResponse;
import com.hanghai.kchtg.beacon.dto.buoy.CreateBuoyRequest;
import com.hanghai.kchtg.beacon.dto.buoy.UpdateBuoyRequest;
import com.hanghai.kchtg.beacon.entity.*;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.beacon.service.BuoyService;
import com.hanghai.kchtg.beacon.service.NotificationService;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    private NotificationService notificationService;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private OrgUnitRepository orgUnitRepo;

    @InjectMocks
    private BuoyService service;

    private ObjectMapper objectMapper;

    @Captor
    private ArgumentCaptor<Buoy> buoyCaptor;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        // Inject a real ObjectMapper via reflection since the field is final
        try {
            java.lang.reflect.Field field = BuoyService.class.getDeclaredField("objectMapper");
            field.setAccessible(true);
            field.set(service, objectMapper);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        GisSpatialObject dummySpatial = new GisSpatialObject();
        dummySpatial.setId(UUID.randomUUID());
        lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(dummySpatial);
    }

    private Buoy makeEntity(UUID id, BeaconStatus status) {
        Buoy entity = Buoy.builder()
                .code("PHAO-001")
                .name("Phao tiêu test")
                .type(BuoyType.CARDINAL)
                .color("Đỏ")
                .shape("Hình trụ")
                .lightCharacteristic("Chớp 3 giây")
                .range(12.0)
                .isActive(true)
                .status(status)
                .approvalStatus(BeaconApprovalStatus.PENDING)
                .build();
        setId(entity, id);
        entity.setCreatedAt(LocalDateTime.now().minusDays(1));
        entity.setUpdatedAt(LocalDateTime.now());
        return entity;
    }

    private static void setId(Object entity, UUID id) {
        try {
            java.lang.reflect.Field idField = BaseEntity.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private CreateBuoyRequest makeCreateRequest() {
        return CreateBuoyRequest.builder()
                .code("PHAO-002")
                .name("Phao tiêu mới")
                .type(BuoyType.SAFE_WATER)
                .latitude(10.5)
                .longitude(106.5)
                .range(15.0)
                .color("Xanh")
                .shape("Hình cầu")
                .lightCharacteristic("Chớp 5 giây")
                .description("Mô tả phao mới")
                .isActive(true)
                .action("draft")
                .build();
    }

    // ─────── READ TESTS ────────────────────────────────────────────

    @Nested
    @DisplayName("READ operations")
    class ReadTests {

        @Test
        @DisplayName("findAll returns list of responses")
        void findAll() {
            Buoy entity = makeEntity(UUID.randomUUID(), BeaconStatus.DRAFT);
            when(buoyRepo.findAll()).thenReturn(List.of(entity));

            List<BuoyResponse> result = service.findAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCode()).isEqualTo("PHAO-001");
            assertThat(result.get(0).getName()).isEqualTo("Phao tiêu test");
            verify(buoyRepo).findAll();
        }

        @Test
        @DisplayName("findById returns response when found")
        void findById() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.DRAFT);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            BuoyResponse result = service.findById(id);

            assertThat(result.getId()).isEqualTo(id);
            assertThat(result.getCode()).isEqualTo("PHAO-001");
            verify(buoyRepo).findById(id);
        }

        @Test
        @DisplayName("findById throws EntityNotFoundException when not found")
        void findByIdNotFound() {
            UUID id = UUID.randomUUID();
            when(buoyRepo.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.findById(id))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Phao tiêu không tìm thấy");

            verify(buoyRepo).findById(id);
        }

        @Test
        @DisplayName("search returns filtered results")
        void search() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.DRAFT);
            when(buoyRepo.searchFiltered(any(), any(), any(), any()))
                    .thenReturn(List.of(entity));

            List<BuoyResponse> result = service.search(
                    "Phao", "PHAO", BuoyType.CARDINAL, BeaconStatus.DRAFT);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Phao tiêu test");
            verify(buoyRepo).searchFiltered("Phao", "PHAO",
                    BuoyType.CARDINAL, BeaconStatus.DRAFT);
        }
    }

    // ─────── CREATE TESTS ──────────────────────────────────────────

    @Nested
    @DisplayName("CREATE operation")
    class CreateTests {

        @Test
        @DisplayName("create with valid data — saves and returns response")
        void createSuccess() {
            UUID savedId = UUID.randomUUID();
            CreateBuoyRequest request = makeCreateRequest();

            when(buoyRepo.existsByCode("PHAO-002")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PHAO-002")).thenReturn(false);
            when(buoyRepo.save(any())).thenAnswer(invocation -> {
                Buoy entity = invocation.getArgument(0);
                setId(entity, savedId);
                return entity;
            });

            BuoyResponse result = service.create(request);

            assertThat(result.getId()).isEqualTo(savedId);
            assertThat(result.getCode()).isEqualTo("PHAO-002");
            assertThat(result.getName()).isEqualTo("Phao tiêu mới");
            assertThat(result.getType()).isEqualTo(BuoyType.SAFE_WATER);
            assertThat(result.getStatus()).isEqualTo(BeaconStatus.DRAFT);
            assertThat(result.getApprovalStatus()).isEqualTo(BeaconApprovalStatus.PENDING);

            verify(buoyRepo, atLeastOnce()).save(any());
            verify(historyRepo).save(any());
            verify(notificationService).sendApprovalNotificationBuoy(any());
        }

        @Test
        @DisplayName("create with duplicate code in buoyRepo — throws IllegalArgumentException")
        void createDuplicateCodeInBuoy() {
            CreateBuoyRequest request = makeCreateRequest();
            when(buoyRepo.existsByCode("PHAO-002")).thenReturn(true);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Đã tồn tại");

            verify(buoyRepo, never()).save(any());
        }

        @Test
        @DisplayName("create with duplicate code in beaconLightRepo — throws IllegalArgumentException")
        void createDuplicateCodeInBeaconLight() {
            CreateBuoyRequest request = makeCreateRequest();
            when(buoyRepo.existsByCode("PHAO-002")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PHAO-002")).thenReturn(true);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Đã tồn tại");

            verify(buoyRepo, never()).save(any());
        }

        @Test
        @DisplayName("create with action=submit — sets PENDING_APPROVAL status")
        void createWithSubmitAction() {
            UUID savedId = UUID.randomUUID();
            CreateBuoyRequest request = makeCreateRequest();
            request.setAction("submit");

            when(buoyRepo.existsByCode("PHAO-002")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PHAO-002")).thenReturn(false);
            when(buoyRepo.save(any())).thenAnswer(invocation -> {
                Buoy entity = invocation.getArgument(0);
                setId(entity, savedId);
                return entity;
            });

            BuoyResponse result = service.create(request);

            assertThat(result.getStatus()).isEqualTo(BeaconStatus.PENDING_APPROVAL);
            assertThat(result.getApprovalLevel()).isEqualTo(1);
        }

        @Test
        @DisplayName("create with null coordinates — throws IllegalArgumentException")
        void createNullCoordinates() {
            CreateBuoyRequest request = makeCreateRequest();
            request.setLatitude(null);
            request.setLongitude(null);

            when(buoyRepo.existsByCode("PHAO-002")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PHAO-002")).thenReturn(false);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Tọa độ không được để trống");

            verify(buoyRepo, never()).save(any());
        }

        @Test
        @DisplayName("create with future lastInspectionDate — throws IllegalArgumentException")
        void createFutureInspectionDate() {
            CreateBuoyRequest request = makeCreateRequest();
            request.setLastInspectionDate(LocalDate.now().plusDays(30));

            when(buoyRepo.existsByCode("PHAO-002")).thenReturn(false);
            when(beaconLightRepo.existsByCode("PHAO-002")).thenReturn(false);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Ngày kiểm tra gần nhất");

            verify(buoyRepo, never()).save(any());
        }
    }

    // ─────── UPDATE TESTS ──────────────────────────────────────────

    @Nested
    @DisplayName("UPDATE operation")
    class UpdateTests {

        @Test
        @DisplayName("update mutable fields — saves and returns updated response")
        void updateSuccess() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.DRAFT);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));
            when(buoyRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .name("Tên mới")
                    .color("Xanh")
                    .shape("Hình vuông")
                    .range(18.0)
                    .build();

            BuoyResponse result = service.update(id, request);

            assertThat(result.getName()).isEqualTo("Tên mới");
            assertThat(result.getColor()).isEqualTo("Xanh");
            assertThat(result.getShape()).isEqualTo("Hình vuông");
            assertThat(result.getRange()).isEqualTo(18.0);
            // Code should remain immutable
            assertThat(result.getCode()).isEqualTo("PHAO-001");

            verify(buoyRepo, atLeastOnce()).save(any());
            verify(historyRepo).save(any());
        }

        @Test
        @DisplayName("update deleted entity — throws EntityNotFoundException")
        void updateDeletedEntity() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.DELETED);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .name("Tên mới")
                    .build();

            assertThatThrownBy(() -> service.update(id, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("đã bị xóa");

            verify(buoyRepo, never()).save(any());
        }

        @Test
        @DisplayName("update with approved type change — throws IllegalArgumentException")
        void updateApprovedTypeChange() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.PUBLISHED);
            entity.setType(BuoyType.CARDINAL);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .type(BuoyType.SECTOR)
                    .build();

            assertThatThrownBy(() -> service.update(id, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Loại phao tiêu không thể thay đổi");
        }

        @Test
        @DisplayName("update on approved entity — reverts status to DRAFT")
        void updateApprovedEntityRevertsStatus() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.APPROVED_L1);
            entity.setApprovalStatus(BeaconApprovalStatus.APPROVED);
            entity.setApprovalLevel(1);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));
            when(buoyRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .name("Tên sửa đổi")
                    .build();

            BuoyResponse result = service.update(id, request);

            assertThat(result.getStatus()).isEqualTo(BeaconStatus.DRAFT);
            assertThat(result.getApprovalStatus()).isEqualTo(BeaconApprovalStatus.PENDING);
            assertThat(result.getApprovalLevel()).isEqualTo(1);
        }

        @Test
        @DisplayName("update keeps code immutable (no code field in update request)")
        void updateCannotChangeCode() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.DRAFT);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));
            when(buoyRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBuoyRequest request = UpdateBuoyRequest.builder()
                    .name("Tên mới")
                    .build();

            BuoyResponse result = service.update(id, request);

            assertThat(result.getCode()).isEqualTo("PHAO-001");
        }
    }

    // ─────── DELETE TESTS ──────────────────────────────────────────

    @Nested
    @DisplayName("DELETE (soft) operation")
    class DeleteTests {

        @Test
        @DisplayName("delete active entity — sets DELETED status")
        void deleteSuccess() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.DRAFT);
            entity.setKhongGianId(UUID.randomUUID());
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));
            when(buoyRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.delete(id);

            verify(buoyRepo).save(buoyCaptor.capture());
            Buoy saved = buoyCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo(BeaconStatus.DELETED);
            assertThat(saved.getDeletedAt()).isNotNull();
            verify(historyRepo).save(any());
            verify(gisSpatialObjectService).delete(entity.getKhongGianId());
        }

        @Test
        @DisplayName("delete already deleted entity — throws IllegalArgumentException")
        void deleteAlreadyDeleted() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.DELETED);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("đã bị xóa trước đó");

            verify(buoyRepo, never()).save(any());
        }

        @Test
        @DisplayName("delete entity in approval process — throws IllegalStateException")
        void deleteInApprovalProcess() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không thể xóa")
                    .hasMessageContaining("chờ phê duyệt");
        }

        @Test
        @DisplayName("delete not found — throws EntityNotFoundException")
        void deleteNotFound() {
            UUID id = UUID.randomUUID();
            when(buoyRepo.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ─────── APPROVAL TESTS ────────────────────────────────────────

    @Nested
    @DisplayName("Approval workflow")
    class ApprovalTests {

        @Test
        @DisplayName("submitForApproval — transitions from DRAFT to PENDING_APPROVAL")
        void submitForApproval() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.DRAFT);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));
            when(buoyRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.submitForApproval(id);

            verify(buoyRepo).save(buoyCaptor.capture());
            Buoy saved = buoyCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo(BeaconStatus.PENDING_APPROVAL);
            assertThat(saved.getApprovalStatus()).isEqualTo(BeaconApprovalStatus.PENDING);
            assertThat(saved.getApprovalLevel()).isEqualTo(1);
            verify(notificationService).sendApprovalNotificationBuoy(entity);
        }

        @Test
        @DisplayName("submitForApproval — throws when not DRAFT")
        void submitForApprovalNotDraft() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.submitForApproval(id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Chỉ có thể gửi phê duyệt khi status = DRAFT");

            verify(buoyRepo, never()).save(any());
        }

        @Test
        @DisplayName("approveL1 — transitions from PENDING_APPROVAL to APPROVED_L1")
        void approveL1() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));
            when(buoyRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BuoyResponse result = service.approveL1(id, "2");

            verify(buoyRepo).save(buoyCaptor.capture());
            Buoy saved = buoyCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo(BeaconStatus.APPROVED_L1);
            assertThat(saved.getApprovalStatus()).isEqualTo(BeaconApprovalStatus.APPROVED);
            assertThat(saved.getApprovedBy()).isEqualTo("2");
            assertThat(saved.getApprovedDate()).isNotNull();
            assertThat(result.getStatus()).isEqualTo(BeaconStatus.APPROVED_L1);
            verify(historyRepo).save(any());
            verify(notificationService).sendL2ApprovalNotificationBuoy(entity);
        }

        @Test
        @DisplayName("approveL1 — throws when not PENDING_APPROVAL")
        void approveL1WrongStatus() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.DRAFT);
            entity.setApprovedBy(null);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.approveL1(id, "2"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không ở trạng thái chờ phê duyệt L1");
        }

        @Test
        @DisplayName("approveL2 — transitions from APPROVED_L1 to PUBLISHED")
        void approveL2() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.APPROVED_L1);
            entity.setApprovedBy("2");
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));
            when(buoyRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BuoyResponse result = service.approveL2(id, "3");

            verify(buoyRepo).save(buoyCaptor.capture());
            Buoy saved = buoyCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo(BeaconStatus.PUBLISHED);
            assertThat(saved.getApprovalStatus()).isEqualTo(BeaconApprovalStatus.APPROVED);
            assertThat(saved.getApprovedBy()).isEqualTo("3");
            assertThat(result.getStatus()).isEqualTo(BeaconStatus.PUBLISHED);
            verify(historyRepo).save(any());
        }

        @Test
        @DisplayName("approveL2 — throws when not APPROVED_L1")
        void approveL2WrongStatus() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.approveL2(id, "3"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không ở trạng thái chờ phê duyệt L2");
        }

        @Test
        @DisplayName("reject with valid reason — transitions to DRAFT + REJECTED")
        void rejectValid() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));
            when(buoyRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BuoyResponse result = service.reject(id,
                    "Lý do từ chối hợp lệ (đủ 10 ký tự)", "2");

            verify(buoyRepo).save(buoyCaptor.capture());
            Buoy saved = buoyCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo(BeaconStatus.DRAFT);
            assertThat(saved.getApprovalStatus()).isEqualTo(BeaconApprovalStatus.REJECTED);
            assertThat(saved.getRejectionReason()).isEqualTo("Lý do từ chối hợp lệ (đủ 10 ký tự)");
            assertThat(result.getStatus()).isEqualTo(BeaconStatus.DRAFT);
            assertThat(result.getApprovalStatus()).isEqualTo(BeaconApprovalStatus.REJECTED);
            verify(notificationService).sendRejectionNotificationBuoy(entity,
                    "Lý do từ chối hợp lệ (đủ 10 ký tự)");
        }

        @Test
        @DisplayName("reject with short reason — throws IllegalArgumentException")
        void rejectShortReason() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.reject(id, "Ngắn", "2"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ít nhất 10 ký tự");
        }

        @Test
        @DisplayName("reject with null reason — throws IllegalArgumentException")
        void rejectNullReason() {
            UUID id = UUID.randomUUID();
            Buoy entity = makeEntity(id, BeaconStatus.PENDING_APPROVAL);
            when(buoyRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.reject(id, null, "2"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ít nhất 10 ký tự");
        }
    }
}
