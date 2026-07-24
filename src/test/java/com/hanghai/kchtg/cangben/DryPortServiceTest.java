package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.dto.cangcan.DryPortResponse;
import com.hanghai.kchtg.cangben.dto.cangcan.CreateDryPortRequest;
import com.hanghai.kchtg.cangben.dto.cangcan.UpdateDryPortRequest;
import com.hanghai.kchtg.cangben.entity.DryPort;
import com.hanghai.kchtg.cangben.repository.DryPortRepository;
import com.hanghai.kchtg.cangben.repository.ChangeLogRepository;
import com.hanghai.kchtg.cangben.repository.ApprovalLogRepository;
import com.hanghai.kchtg.cangben.service.DryPortApprovalService;
import com.hanghai.kchtg.cangben.service.DryPortService;
import com.hanghai.kchtg.cangben.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.cangben.service.shared.AuditLogService;
import com.hanghai.kchtg.cangben.service.shared.CangBenNotificationService;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import com.hanghai.kchtg.cangben.service.shared.UserResolverService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DryPortService + DryPortApprovalService unit tests — F-026/F-027/F-028/F-030")
class DryPortServiceTest {

    // ── DryPortService tests ─────────────────────────────────────────────────

    @Nested
    @DisplayName("DryPortService — CRUD")
    class CrudTests {

        @InjectMocks
        private DryPortService service;

        @Mock
        private DryPortRepository dryPortRepository;

        @Mock
        private LichSuThayDoiService lichSuThayDoiService;

        @Mock
        private AuditLogService auditLogService;

        @Mock
        private UserResolverService userResolverService;

        @Mock
        private com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

        private UUID testId;
        private DryPort testEntity;

        @BeforeEach
        void setUp() {
            lenient().when(userResolverService.resolveName(any())).thenAnswer(inv -> {
                String arg = inv.getArgument(0);
                return arg != null ? arg : "SYSTEM";
            });
            lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenAnswer(inv -> {
                        com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatial = new com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject();
                        spatial.setId(UUID.randomUUID());
                        return spatial;
                    });

            testId = UUID.randomUUID();
            testEntity = new DryPort();
            ReflectionTestUtils.setField(testEntity, "id", testId);
            testEntity.setDryPortCode("CC-001");
            testEntity.setDryPortName("Cảng Cạn Demo");
            testEntity.setProvince("Hà Nội");
            testEntity.setArea(new BigDecimal("10000.00"));
            testEntity.setTeuCapacity(new BigDecimal("50000.00"));
            testEntity.setOperationalStatus(TrangThaiHoatDong.HIEN_HANH);
            testEntity.setApprovalStatus(TrangThaiPheDuyet.CHO_PHE_DUYET);
        }

        @Test
        @DisplayName("F-026: create — saves and returns response")
        void create_success() {
            CreateDryPortRequest request = buildCreateRequest("CC-NEW", "Cảng cạn mới");
            when(dryPortRepository.existsByDryPortCode("CC-NEW")).thenReturn(false);
            when(dryPortRepository.save(any(DryPort.class))).thenAnswer(inv -> {
                DryPort saved = inv.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
                return saved;
            });

            DryPortResponse result = service.create(request);

            assertNotNull(result);
            assertEquals("CC-NEW", result.getDryPortCode());
            assertEquals("Cảng cạn mới", result.getDryPortName());
            assertEquals(TrangThaiPheDuyet.CHO_PHE_DUYET, result.getApprovalStatus());
            verify(dryPortRepository).save(any(DryPort.class));
        }

        @Test
        @DisplayName("F-026: create — duplicate dryPortCode → IllegalArgumentException")
        void create_duplicateCode_throwsIllegalArg() {
            CreateDryPortRequest request = buildCreateRequest("CC-001", "Trùng mã");
            when(dryPortRepository.existsByDryPortCode("CC-001")).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.create(request));
            assertTrue(ex.getMessage().contains("CC-001"));
            verify(dryPortRepository, never()).save(any());
        }

        @Test
        @DisplayName("F-027: update — applies mutable fields, resets to CHO_PHE_DUYET, calls recordChanges")
        void update_appliesMutableFields() {
            testEntity.setApprovalStatus(TrangThaiPheDuyet.DUOC_PHE_DUYET);
            when(dryPortRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(dryPortRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateDryPortRequest request = new UpdateDryPortRequest();
            request.setId(testId);
            request.setDryPortName("Cảng Cạn Cập Nhật");
            request.setProvince("Hải Phòng");

            DryPortResponse result = service.update(request);

            assertEquals("Cảng Cạn Cập Nhật", result.getDryPortName());
            assertEquals(TrangThaiPheDuyet.CHO_PHE_DUYET, result.getApprovalStatus());
            assertEquals("CC-001", result.getDryPortCode()); // code unchanged
            verify(lichSuThayDoiService).recordChanges(eq("DryPort"), any(), any(), any(), any());
        }

        @Test
        @DisplayName("F-027: update — entity not found → EntityNotFoundException")
        void update_notFound_throws() {
            UpdateDryPortRequest request = new UpdateDryPortRequest();
            request.setId(testId);
            when(dryPortRepository.findById(testId)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class, () -> service.update(request));
        }

        @Test
        @DisplayName("F-028: softDelete — entity found, soft-deleted and saved")
        void softDelete_setsDeletedAt() {
            when(dryPortRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(dryPortRepository.save(any())).thenReturn(testEntity);

            service.softDelete(testId);

            assertNotNull(testEntity.getDeletedAt());
            verify(dryPortRepository).save(testEntity);
        }

        @Test
        @DisplayName("F-028: softDelete — entity not found → EntityNotFoundException")
        void softDelete_notFound_throws() {
            when(dryPortRepository.findById(testId)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
        }

        private CreateDryPortRequest buildCreateRequest(String dryPortCode, String dryPortName) {
            CreateDryPortRequest req = new CreateDryPortRequest();
            req.setDryPortCode(dryPortCode);
            req.setDryPortName(dryPortName);
            req.setProvince("Hà Nội");
            req.setOperationalStatus(TrangThaiHoatDong.HIEN_HANH);
            return req;
        }
    }

    // ── DryPortApprovalService tests ─────────────────────────────────────────

    @Nested
    @DisplayName("DryPortApprovalService — approval state machine")
    class ApprovalTests {

        @InjectMocks
        private DryPortApprovalService approvalService;

        @Mock
        private DryPortRepository dryPortRepository;

        @Mock
        private ApprovalWorkflowService approvalWorkflowService;

        @Mock
        private CangBenNotificationService notificationService;

        @Mock
        private ChangeLogRepository changeLogRepository;

        @Mock
        private ApprovalLogRepository approvalLogRepository;

        private UUID testId;
        private DryPort testEntity;

        @BeforeEach
        void setUp() {
            testId = UUID.randomUUID();
            testEntity = new DryPort();
            ReflectionTestUtils.setField(testEntity, "id", testId);
            testEntity.setDryPortCode("CC-001");
            testEntity.setDryPortName("Cảng Cạn Demo");
            testEntity.setApprovalStatus(TrangThaiPheDuyet.CHO_PHE_DUYET);
        }

        @Test
        @DisplayName("F-030: approve — null reason → sets DUOC_PHE_DUYET")
        void approve_setsApprovedStatus() {
            when(dryPortRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(dryPortRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            approvalService.approve(testId, "admin-user", null);

            assertEquals(TrangThaiPheDuyet.DUOC_PHE_DUYET, testEntity.getApprovalStatus());
            verify(approvalWorkflowService).approve(eq("CHO_PHE_DUYET"), eq("DryPort"),
                    eq(testId.toString()), eq("admin-user"));
            verify(dryPortRepository).save(testEntity);
        }

        @Test
        @DisplayName("F-030: reject — non-blank reason → sets TU_CHOI")
        void reject_setsTuChoiStatus() {
            when(dryPortRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(dryPortRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            approvalService.approve(testId, "admin-user", "Hồ sơ chưa đầy đủ");

            assertEquals(TrangThaiPheDuyet.TU_CHOI, testEntity.getApprovalStatus());
            verify(approvalWorkflowService).reject(eq("CHO_PHE_DUYET"), eq("DryPort"),
                    eq(testId.toString()), eq("admin-user"), eq("Hồ sơ chưa đầy đủ"));
            verify(dryPortRepository).save(testEntity);
        }

        @Test
        @DisplayName("F-030: approve on already approved entity → approvalWorkflowService.approve throws IllegalStateException")
        void doubleApprove_throwsIllegalState() {
            testEntity.setApprovalStatus(TrangThaiPheDuyet.DUOC_PHE_DUYET);
            when(dryPortRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(approvalWorkflowService.approve(eq("DUOC_PHE_DUYET"), any(), any(), any()))
                    .thenThrow(new IllegalStateException("Cannot approve: state is DUOC_PHE_DUYET"));

            assertThrows(IllegalStateException.class,
                    () -> approvalService.approve(testId, "admin-user", null));
        }
    }
}
