package com.hanghai.kchtg.beacon;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hanghai.kchtg.beacon.dto.beacon_light.BeaconLightResponse;
import com.hanghai.kchtg.beacon.dto.beacon_light.CreateBeaconLightRequest;
import com.hanghai.kchtg.beacon.dto.beacon_light.UpdateBeaconLightRequest;
import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.beacon.service.BeaconLightService;
import com.hanghai.kchtg.beacon.service.NotificationService;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
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
import static org.mockito.ArgumentMatchers.any;
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
    private NotificationService notificationService;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private OrgUnitRepository orgUnitRepo;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;

    @InjectMocks
    private BeaconLightService service;

    private ObjectMapper objectMapper;

    @Captor
    private ArgumentCaptor<BeaconLight> beaconLightCaptor;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        // Inject a real ObjectMapper via reflection since the field is final
        try {
            java.lang.reflect.Field field = BeaconLightService.class.getDeclaredField("objectMapper");
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

    private BeaconLight makeEntity(UUID id, String status) {
        BeaconLight entity = BeaconLight.builder()
                .code("DEN-001")
                .name("Đèn biển test")
                .type("LIGHTHOUSE")
                .lightRange(15.0)
                .towerColor("Trắng")
                .area(12.0)
                .isActive(true)
                .status(status)
                .approvalStatus("PENDING")
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

    private CreateBeaconLightRequest makeCreateRequest() {
        return CreateBeaconLightRequest.builder()
                .code("DEN-002")
                .name("Đèn biển mới")
                .type("BEACON_LIGHT")
                .lightRange(15.0)
                .towerColor("Đỏ")
                .primaryLightModel("Chớp 5 giây")
                .area(12.0)
                .location("Mô tả")
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
            BeaconLight entity = makeEntity(UUID.randomUUID(), "DRAFT");
            when(beaconLightRepo.findAll()).thenReturn(List.of(entity));

            List<BeaconLightResponse> result = service.findAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCode()).isEqualTo("DEN-001");
            assertThat(result.get(0).getName()).isEqualTo("Đèn biển test");
            verify(beaconLightRepo).findAll();
        }

        @Test
        @DisplayName("findById returns response when found")
        void findById() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "DRAFT");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            BeaconLightResponse result = service.findById(id);

            assertThat(result.getId()).isEqualTo(id);
            assertThat(result.getCode()).isEqualTo("DEN-001");
            verify(beaconLightRepo).findById(id);
        }

        @Test
        @DisplayName("findById throws EntityNotFoundException when not found")
        void findByIdNotFound() {
            UUID id = UUID.randomUUID();
            when(beaconLightRepo.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.findById(id))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Đèn biển không tìm thấy");

            verify(beaconLightRepo).findById(id);
        }

        @Test
        @DisplayName("search returns filtered results")
        void search() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "DRAFT");
            when(beaconLightRepo.searchFiltered(any(), any(), any(), any()))
                    .thenReturn(List.of(entity));

            List<BeaconLightResponse> result = service.search(
                    "Đèn", "DEN", "LIGHTHOUSE", "DRAFT");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Đèn biển test");
            verify(beaconLightRepo).searchFiltered("Đèn", "DEN",
                    "LIGHTHOUSE", "DRAFT");
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
            CreateBeaconLightRequest request = makeCreateRequest();

            when(beaconLightRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> {
                BeaconLight entity = invocation.getArgument(0);
                setId(entity, savedId);
                return entity;
            });

            BeaconLightResponse result = service.create(request);

            assertThat(result.getId()).isEqualTo(savedId);
            assertThat(result.getCode()).isEqualTo("DEN-002");
            assertThat(result.getName()).isEqualTo("Đèn biển mới");
            assertThat(result.getType()).isEqualTo("BEACON_LIGHT");
            assertThat(result.getStatus()).isEqualTo("DRAFT");
            assertThat(result.getApprovalStatus()).isEqualTo("PENDING");

            verify(beaconLightRepo, atLeastOnce()).save(any());
            verify(historyRepo).save(any());
            verify(notificationService).sendApprovalNotification(any());
        }

        @Test
        @DisplayName("create with duplicate code — throws IllegalArgumentException")
        void createDuplicateCode() {
            CreateBeaconLightRequest request = makeCreateRequest();
            when(beaconLightRepo.existsByCode("DEN-002")).thenReturn(true);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Mã đã tồn tại");

            verify(beaconLightRepo, never()).save(any());
        }

        @Test
        @DisplayName("create with action=submit — sets PENDING_APPROVAL status")
        void createWithSubmitAction() {
            UUID savedId = UUID.randomUUID();
            CreateBeaconLightRequest request = makeCreateRequest();
            request.setAction("submit");

            when(beaconLightRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> {
                BeaconLight entity = invocation.getArgument(0);
                setId(entity, savedId);
                return entity;
            });

            BeaconLightResponse result = service.create(request);

            assertThat(result.getStatus()).isEqualTo("PENDING_APPROVAL");
            assertThat(result.getApprovalLevel()).isEqualTo(ApprovalLevel.LEVEL_1);
        }

        @Test
        @DisplayName("create with future lastMaintenanceDate — throws IllegalArgumentException")
        void createFutureMaintenanceDate() {
            CreateBeaconLightRequest request = makeCreateRequest();
            request.setLastRepairDate(LocalDate.now().plusDays(30));

            when(beaconLightRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Ngày bảo trì gần nhất");

            verify(beaconLightRepo, never()).save(any());
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
            BeaconLight entity = makeEntity(id, "DRAFT");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .name("Tên mới")
                    .towerColor("Xanh")
                    .area(18.0)
                    .build();

            BeaconLightResponse result = service.update(id, request);

            assertThat(result.getName()).isEqualTo("Tên mới");
            assertThat(result.getTowerColor()).isEqualTo("Xanh");
            assertThat(result.getArea()).isEqualTo(18.0);
            // Code should remain immutable
            assertThat(result.getCode()).isEqualTo("DEN-001");

            verify(beaconLightRepo, atLeastOnce()).save(any());
            verify(historyRepo).save(any());
        }

        @Test
        @DisplayName("update deleted entity — throws EntityNotFoundException")
        void updateDeletedEntity() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "DELETED");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .name("Tên mới")
                    .build();

            assertThatThrownBy(() -> service.update(id, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("đã bị xóa");

            verify(beaconLightRepo, never()).save(any());
        }

        @Test
        @DisplayName("update with approved type change — throws IllegalArgumentException")
        void updateApprovedTypeChange() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "PUBLISHED");
            entity.setType("LIGHTHOUSE");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .type("BEACON_MARK")
                    .build();

            assertThatThrownBy(() -> service.update(id, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Loại đèn biển không thể thay đổi");
        }

        @Test
        @DisplayName("update on approved entity — reverts status to DRAFT")
        void updateApprovedEntityRevertsStatus() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "APPROVED_L1");
            entity.setApprovalStatus("APPROVED");
            entity.setApprovalLevel(1);
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .name("Tên sửa đổi")
                    .build();

            BeaconLightResponse result = service.update(id, request);

            assertThat(result.getStatus()).isEqualTo("DRAFT");
            assertThat(result.getApprovalStatus()).isEqualTo("PENDING");
            assertThat(result.getApprovalLevel()).isEqualTo(ApprovalLevel.LEVEL_1);
        }

        @Test
        @DisplayName("update keeps code immutable")
        void updateCannotChangeCode() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "DRAFT");
            // The UpdateBeaconLightRequest has no code field — it's not mutable
            // Verify that the entity's code stays unchanged after any update
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .name("Tên mới")
                    .build();

            BeaconLightResponse result = service.update(id, request);

            assertThat(result.getCode()).isEqualTo("DEN-001");
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
            BeaconLight entity = makeEntity(id, "DRAFT");
            entity.setSpatialId(UUID.randomUUID());
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.delete(id);

            verify(beaconLightRepo).save(beaconLightCaptor.capture());
            BeaconLight saved = beaconLightCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("DELETED");
            assertThat(saved.getDeletedAt()).isNotNull();
            verify(historyRepo).save(any());
            verify(gisSpatialObjectService).delete(entity.getSpatialId());
        }

        @Test
        @DisplayName("delete already deleted entity — throws IllegalArgumentException")
        void deleteAlreadyDeleted() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "DELETED");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("đã bị xóa trước đó");

            verify(beaconLightRepo, never()).save(any());
        }

        @Test
        @DisplayName("delete entity in approval process — throws IllegalStateException")
        void deleteInApprovalProcess() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không thể xóa")
                    .hasMessageContaining("chờ phê duyệt");
        }

        @Test
        @DisplayName("delete not found — throws EntityNotFoundException")
        void deleteNotFound() {
            UUID id = UUID.randomUUID();
            when(beaconLightRepo.findById(id)).thenReturn(Optional.empty());

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
            BeaconLight entity = makeEntity(id, "DRAFT");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.submitForApproval(id);

            verify(beaconLightRepo).save(beaconLightCaptor.capture());
            BeaconLight saved = beaconLightCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("PENDING_APPROVAL");
            assertThat(saved.getApprovalStatus()).isEqualTo("PENDING");
            assertThat(saved.getApprovalLevel()).isEqualTo(1);
            verify(notificationService).sendApprovalNotification(entity);
        }

        @Test
        @DisplayName("submitForApproval — throws when not DRAFT")
        void submitForApprovalNotDraft() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.submitForApproval(id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Chỉ có thể gửi phê duyệt khi status = DRAFT");

            verify(beaconLightRepo, never()).save(any());
        }

        @Test
        @DisplayName("approveL1 — transitions from PENDING_APPROVAL to APPROVED_L1")
        void approveL1() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BeaconLightResponse result = service.approveL1(id, java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));

            verify(beaconLightRepo).save(beaconLightCaptor.capture());
            BeaconLight saved = beaconLightCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("APPROVED_L1");
            assertThat(saved.getApprovalStatus()).isEqualTo("APPROVED");
            assertThat(saved.getApprovedBy()).isEqualTo(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
            assertThat(saved.getApprovedDate()).isNotNull();
            assertThat(result.getStatus()).isEqualTo("APPROVED_L1");
            verify(historyRepo).save(any());
            verify(notificationService).sendL2ApprovalNotification(entity);
        }

        @Test
        @DisplayName("approveL1 — throws when not PENDING_APPROVAL")
        void approveL1WrongStatus() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "DRAFT");
            entity.setApprovedBy(null);
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.approveL1(id, java.util.UUID.fromString("00000000-0000-0000-0000-000000000002")))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không ở trạng thái chờ phê duyệt L1");
        }

        @Test
        @DisplayName("approveL2 — transitions from APPROVED_L1 to PUBLISHED")
        void approveL2() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "APPROVED_L1");
            entity.setApprovedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BeaconLightResponse result = service.approveL2(id, java.util.UUID.fromString("00000000-0000-0000-0000-000000000003"));

            verify(beaconLightRepo).save(beaconLightCaptor.capture());
            BeaconLight saved = beaconLightCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("PUBLISHED");
            assertThat(saved.getApprovalStatus()).isEqualTo("APPROVED");
            assertThat(saved.getApprovedBy()).isEqualTo(java.util.UUID.fromString("00000000-0000-0000-0000-000000000003"));
            assertThat(result.getStatus()).isEqualTo("PUBLISHED");
            verify(historyRepo).save(any());
        }

        @Test
        @DisplayName("approveL2 — throws when not APPROVED_L1")
        void approveL2WrongStatus() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.approveL2(id, java.util.UUID.fromString("00000000-0000-0000-0000-000000000003")))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không ở trạng thái chờ phê duyệt L2");
        }

        @Test
        @DisplayName("reject with valid reason — transitions to DRAFT + REJECTED")
        void rejectValid() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconLightRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BeaconLightResponse result = service.reject(id,
                    "Lý do từ chối hợp lệ (đủ 10 ký tự)", java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));

            verify(beaconLightRepo).save(beaconLightCaptor.capture());
            BeaconLight saved = beaconLightCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("DRAFT");
            assertThat(saved.getApprovalStatus()).isEqualTo("REJECTED");
            assertThat(saved.getRejectionReason()).isEqualTo("Lý do từ chối hợp lệ (đủ 10 ký tự)");
            assertThat(result.getStatus()).isEqualTo("DRAFT");
            assertThat(result.getApprovalStatus()).isEqualTo("REJECTED");
            verify(notificationService).sendRejectionNotification(entity,
                    "Lý do từ chối hợp lệ (đủ 10 ký tự)");
        }

        @Test
        @DisplayName("reject with short reason — throws IllegalArgumentException")
        void rejectShortReason() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.reject(id, "Ngắn", java.util.UUID.fromString("00000000-0000-0000-0000-000000000002")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ít nhất 10 ký tự");
        }

        @Test
        @DisplayName("reject with null reason — throws IllegalArgumentException")
        void rejectNullReason() {
            UUID id = UUID.randomUUID();
            BeaconLight entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconLightRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.reject(id, null, java.util.UUID.fromString("00000000-0000-0000-0000-000000000002")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ít nhất 10 ký tự");
        }
    }
}
