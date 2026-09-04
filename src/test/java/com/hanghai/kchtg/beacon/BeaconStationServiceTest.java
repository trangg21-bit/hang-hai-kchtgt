package com.hanghai.kchtg.beacon;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hanghai.kchtg.beacon.dto.beacon_station.BeaconStationResponse;
import com.hanghai.kchtg.beacon.dto.beacon_station.CreateBeaconStationRequest;
import com.hanghai.kchtg.beacon.dto.beacon_station.UpdateBeaconStationRequest;
import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.beacon.service.BeaconStationService;
import com.hanghai.kchtg.beacon.service.NotificationService;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
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
class BeaconStationServiceTest {

    @Mock
    private BeaconStationRepository beaconStationRepo;

    @Mock
    private BuoyRepository buoyRepo;

    @Mock
    private BeaconHistoryRepository historyRepo;

    @Mock
    private com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository infraHistoryRepo;

    @Mock
    private NotificationService notificationService;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private OrgUnitRepository orgUnitRepo;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitScopeService orgUnitScopeService;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;

    @Mock
    private com.hanghai.kchtg.port.service.shared.UserResolverService userResolverService;

    @InjectMocks
    private BeaconStationService service;

    private ObjectMapper objectMapper;

    @Captor
    private ArgumentCaptor<BeaconStation> beaconStationCaptor;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        // Inject a real ObjectMapper via reflection since the field is final
        try {
            java.lang.reflect.Field field = BeaconStationService.class.getDeclaredField("objectMapper");
            field.setAccessible(true);
            field.set(service, objectMapper);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        GisSpatialObject dummySpatial = new GisSpatialObject();
        dummySpatial.setId(UUID.randomUUID());
        lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(dummySpatial);
        lenient().when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.allScope());
        lenient().when(orgUnitCacheService.getName(any())).thenReturn("Đơn vị Test");
        lenient().when(userResolverService.resolveName(any())).thenReturn("Admin Test");
    }

    private BeaconStation makeEntity(UUID id, String status) {
        BeaconStation entity = BeaconStation.builder()
                .code("DEN-001")
                .name("Đèn biển test")
                .type("LIGHTHOUSE")
                .unitId(UUID.randomUUID())
                .lightRange(15.0)
                .towerColor("Trắng")
                .area(12.0)
                .isActive(true)
                .status(status)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
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

    private CreateBeaconStationRequest makeCreateRequest() {
        return CreateBeaconStationRequest.builder()
                .code("DEN-002")
                .name("Đèn biển mới")
                .unitId(UUID.randomUUID())
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
            BeaconStation entity = makeEntity(UUID.randomUUID(), "DRAFT");
            when(beaconStationRepo.findAll()).thenReturn(List.of(entity));

            List<BeaconStationResponse> result = service.findAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCode()).isEqualTo("DEN-001");
            assertThat(result.get(0).getName()).isEqualTo("Đèn biển test");
            verify(beaconStationRepo).findAll();
        }

        @Test
        @DisplayName("findById returns response when found")
        void findById() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            BeaconStationResponse result = service.findById(id);

            assertThat(result.getId()).isEqualTo(id);
            assertThat(result.getCode()).isEqualTo("DEN-001");
            verify(beaconStationRepo).findById(id);
        }

        @Test
        @DisplayName("findById throws EntityNotFoundException when not found")
        void findByIdNotFound() {
            UUID id = UUID.randomUUID();
            when(beaconStationRepo.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.findById(id))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Đèn biển không tìm thấy");

            verify(beaconStationRepo).findById(id);
        }

        @Test
        @DisplayName("search returns filtered results")
        void search() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            when(beaconStationRepo.searchFiltered(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                    any(), any(), any(), any(), any(), any()))
                    .thenReturn(List.of(entity));

            List<BeaconStationResponse> result = service.search(
                    "Đèn", "DEN", "LIGHTHOUSE", "DRAFT", null, null, null, null, null, null, null, null, null, null,
                    null, null);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Đèn biển test");
            verify(beaconStationRepo).searchFiltered("Đèn", "DEN",
                    "LIGHTHOUSE", "DRAFT", null, null, null, null, null, null, null, null, null, null, null, null);
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
            CreateBeaconStationRequest request = makeCreateRequest();

            when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> {
                BeaconStation entity = invocation.getArgument(0);
                setId(entity, savedId);
                return entity;
            });

            BeaconStationResponse result = service.create(request);

            assertThat(result.getId()).isEqualTo(savedId);
            assertThat(result.getCode()).isEqualTo("DEN-002");
            assertThat(result.getName()).isEqualTo("Đèn biển mới");
            assertThat(result.getType()).isEqualTo("BEACON_LIGHT");
            assertThat(result.getStatus()).isEqualTo("DRAFT");
            assertThat(result.getApprovalStatus()).isEqualTo("PROPOSED");

            verify(beaconStationRepo, atLeastOnce()).save(any());
            verify(infraHistoryRepo).save(any());
            verify(notificationService).sendApprovalNotification(any());
        }

        @Test
        @DisplayName("create with duplicate code — throws IllegalArgumentException")
        void createDuplicateCode() {
            CreateBeaconStationRequest request = makeCreateRequest();
            when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(true);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Mã đã tồn tại");

            verify(beaconStationRepo, never()).save(any());
        }

        @Test
        @DisplayName("create with action=submit — sets PENDING_APPROVAL status")
        void createWithSubmitAction() {
            UUID savedId = UUID.randomUUID();
            CreateBeaconStationRequest request = makeCreateRequest();
            request.setAction("submit");

            when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> {
                BeaconStation entity = invocation.getArgument(0);
                setId(entity, savedId);
                return entity;
            });

            BeaconStationResponse result = service.create(request);

            assertThat(result.getStatus()).isEqualTo("PENDING_APPROVAL");
            assertThat(result.getApprovalLevel()).isEqualTo(ApprovalLevel.LEVEL_1);
        }

        @Test
        @DisplayName("create with future lastMaintenanceDate — throws IllegalArgumentException")
        void createFutureMaintenanceDate() {
            CreateBeaconStationRequest request = makeCreateRequest();
            request.setLastRepairDate(LocalDate.now().plusDays(30));

            when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Ngày bảo trì gần nhất");

            verify(beaconStationRepo, never()).save(any());
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
            BeaconStation entity = makeEntity(id, "DRAFT");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name("Tên mới")
                    .towerColor("Xanh")
                    .area(18.0)
                    .build();

            BeaconStationResponse result = service.update(id, request);

            assertThat(result.getName()).isEqualTo("Tên mới");
            assertThat(result.getTowerColor()).isEqualTo("Xanh");
            assertThat(result.getArea()).isEqualTo(18.0);
            // Code should remain immutable
            assertThat(result.getCode()).isEqualTo("DEN-001");

            verify(beaconStationRepo, atLeastOnce()).save(any());
            verify(historyRepo, never()).save(any());
        }

        @Test
        @DisplayName("update deleted entity — throws EntityNotFoundException")
        void updateDeletedEntity() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DELETED");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name("Tên mới")
                    .build();

            assertThatThrownBy(() -> service.update(id, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("đã bị xóa");

            verify(beaconStationRepo, never()).save(any());
        }

        @Test
        @DisplayName("update with approved type change — throws IllegalArgumentException")
        void updateApprovedTypeChange() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PUBLISHED");
            entity.setType("LIGHTHOUSE");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .type("BEACON_MARK")
                    .build();

            assertThatThrownBy(() -> service.update(id, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Loại đèn biển không thể thay đổi");
        }

        @Test
        @DisplayName("update on approved entity — keeps APPROVED status and records history")
        void updateApprovedEntityRevertsStatus() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "APPROVED_L2");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovalLevel(2);
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name("Tên sửa đổi")
                    .build();

            BeaconStationResponse result = service.update(id, request);

            assertThat(result.getStatus()).isEqualTo("APPROVED_L2");
            assertThat(result.getApprovalStatus()).isEqualTo("APPROVED");
            verify(infraHistoryRepo, atLeastOnce()).save(any());
        }

        @Test
        @DisplayName("update keeps code immutable")
        void updateCannotChangeCode() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            // The UpdateBeaconStationRequest has no code field — it's not mutable
            // Verify that the entity's code stays unchanged after any update
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name("Tên mới")
                    .build();

            BeaconStationResponse result = service.update(id, request);

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
            BeaconStation entity = makeEntity(id, "DRAFT");
            entity.setSpatialId(UUID.randomUUID());
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.delete(id);

            verify(beaconStationRepo).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("DELETED");
            assertThat(saved.getDeletedAt()).isNotNull();
            verify(infraHistoryRepo).save(any());
            verify(gisSpatialObjectService).delete(entity.getSpatialId());
        }

        @Test
        @DisplayName("delete already deleted entity — throws IllegalArgumentException")
        void deleteAlreadyDeleted() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DELETED");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("đã bị xóa trước đó");

            verify(beaconStationRepo, never()).save(any());
        }

        @Test
        @DisplayName("delete entity in approval process — throws IllegalStateException")
        void deleteInApprovalProcess() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không thể xóa")
                    .hasMessageContaining("chờ phê duyệt");
        }

        @Test
        @DisplayName("delete not found — throws EntityNotFoundException")
        void deleteNotFound() {
            UUID id = UUID.randomUUID();
            when(beaconStationRepo.findById(id)).thenReturn(Optional.empty());

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
            BeaconStation entity = makeEntity(id, "DRAFT");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.submitForApproval(id);

            verify(beaconStationRepo).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("PENDING_APPROVAL");
            assertThat(saved.getApprovalStatus()).isEqualTo(ApprovalStatus.PROPOSED);
            assertThat(saved.getApprovalLevel()).isEqualTo(1);
            verify(notificationService).sendApprovalNotification(entity);
        }

        @Test
        @DisplayName("submitForApproval — throws when not DRAFT")
        void submitForApprovalNotDraft() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.submitForApproval(id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Chỉ có thể gửi phê duyệt khi status = DRAFT");

            verify(beaconStationRepo, never()).save(any());
        }

        @Test
        @DisplayName("approveL1 — transitions from PENDING_APPROVAL to APPROVED")
        void approveL1() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BeaconStationResponse result = service.approveL1(id,
                    java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"), null);

            verify(beaconStationRepo).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1.name());
            assertThat(saved.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1);
            assertThat(saved.getApproverLevel1())
                    .isEqualTo(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
            assertThat(saved.getApprovedDateLevel1()).isNotNull();
            assertThat(result.getStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1.name());
            verify(infraHistoryRepo).save(any());
        }

        @Test
        @DisplayName("approveL1 — throws when not PENDING_APPROVAL")
        void approveL1WrongStatus() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            entity.setApprovedBy(null);
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.approveL1(id,
                    java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"), null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không ở trạng thái chờ phê duyệt L1");
        }

        @Test
        @DisplayName("reject with valid reason — transitions to DRAFT + REJECTED")
        void rejectValid() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BeaconStationResponse result = service.reject(id,
                    "Lý do từ chối hợp lệ (đủ 10 ký tự)",
                    java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));

            verify(beaconStationRepo).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("DRAFT");
            assertThat(saved.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED_LEVEL1);
            assertThat(saved.getRejectionReason()).isEqualTo("Lý do từ chối hợp lệ (đủ 10 ký tự)");
            assertThat(result.getStatus()).isEqualTo("DRAFT");
            assertThat(result.getApprovalStatus()).isEqualTo("REJECTED_LEVEL1");
            verify(notificationService).sendRejectionNotification(entity,
                    "Lý do từ chối hợp lệ (đủ 10 ký tự)");
        }

        @Test
        @DisplayName("reject with short reason — throws IllegalArgumentException")
        void rejectShortReason() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(
                    () -> service.reject(id, "Ngắn", java.util.UUID.fromString("00000000-0000-0000-0000-000000000002")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ít nhất 10 ký tự");
        }

        @Test
        @DisplayName("reject with null reason — throws IllegalArgumentException")
        void rejectNullReason() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(
                    () -> service.reject(id, null, java.util.UUID.fromString("00000000-0000-0000-0000-000000000002")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ít nhất 10 ký tự");
        }
    }
}
