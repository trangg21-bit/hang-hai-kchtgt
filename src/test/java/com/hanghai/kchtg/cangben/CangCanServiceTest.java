package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.dto.cangcan.CangCanResponse;
import com.hanghai.kchtg.cangben.dto.cangcan.CreateCangCanRequest;
import com.hanghai.kchtg.cangben.dto.cangcan.UpdateCangCanRequest;
import com.hanghai.kchtg.cangben.entity.CangCan;
import com.hanghai.kchtg.cangben.repository.CangCanRepository;
import com.hanghai.kchtg.cangben.repository.LichSuThayDoiRepository;
import com.hanghai.kchtg.cangben.repository.PheDuyetLogRepository;
import com.hanghai.kchtg.cangben.service.CangCanApprovalService;
import com.hanghai.kchtg.cangben.service.CangCanService;
import com.hanghai.kchtg.cangben.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.cangben.service.shared.AuditLogService;
import com.hanghai.kchtg.cangben.service.shared.CangBenNotificationService;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
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

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CangCanService + CangCanApprovalService unit tests — F-026/F-027/F-028/F-030")
class CangCanServiceTest {

    // ── CangCanService tests ─────────────────────────────────────────────────

    @Nested
    @DisplayName("CangCanService — CRUD")
    class CrudTests {

        @InjectMocks
        private CangCanService service;

        @Mock
        private CangCanRepository cangCanRepository;

        @Mock
        private LichSuThayDoiService lichSuThayDoiService;

        @Mock
        private AuditLogService auditLogService;

        private UUID testId;
        private CangCan testEntity;

        @BeforeEach
        void setUp() {
            testId = UUID.randomUUID();
            testEntity = new CangCan();
            ReflectionTestUtils.setField(testEntity, "id", testId);
            testEntity.setMaCangCan("CC-001");
            testEntity.setTenCangCan("Cảng Cạn Demo");
            testEntity.setTinhThanhPho("Hà Nội");
            testEntity.setViDo(new BigDecimal("21.028"));
            testEntity.setKinhDo(new BigDecimal("105.854"));
            testEntity.setDienTich(new BigDecimal("10000.00"));
            testEntity.setCongSuatTEU(new BigDecimal("50000.00"));
            testEntity.setTrangThaiHoatDong("HIEN_HANH");
            testEntity.setTrangThaiPheDuyet("CHO_PHE_DUYET");
        }

        @Test
        @DisplayName("F-026: create — saves and returns response")
        void create_success() {
            CreateCangCanRequest request = buildCreateRequest("CC-NEW", "Cảng cạn mới");
            when(cangCanRepository.existsByMaCangCan("CC-NEW")).thenReturn(false);
            when(cangCanRepository.save(any(CangCan.class))).thenAnswer(inv -> {
                CangCan saved = inv.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
                return saved;
            });

            CangCanResponse result = service.create(request);

            assertNotNull(result);
            assertEquals("CC-NEW", result.getMaCangCan());
            assertEquals("Cảng cạn mới", result.getTenCangCan());
            assertEquals("CHO_PHE_DUYET", result.getTrangThaiPheDuyet());
            verify(cangCanRepository).save(any(CangCan.class));
        }

        @Test
        @DisplayName("F-026: create — duplicate maCangCan → IllegalArgumentException")
        void create_duplicateCode_throwsIllegalArg() {
            CreateCangCanRequest request = buildCreateRequest("CC-001", "Trùng mã");
            when(cangCanRepository.existsByMaCangCan("CC-001")).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.create(request));
            assertTrue(ex.getMessage().contains("CC-001"));
            verify(cangCanRepository, never()).save(any());
        }

        @Test
        @DisplayName("F-027: update — applies mutable fields, resets to CHO_PHE_DUYET, calls recordChanges")
        void update_appliesMutableFields() {
            testEntity.setTrangThaiPheDuyet("DUOC_PHE_DUYET");
            when(cangCanRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(cangCanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateCangCanRequest request = new UpdateCangCanRequest();
            request.setId(testId);
            request.setTenCangCan("Cảng Cạn Cập Nhật");
            request.setTinhThanhPho("Hải Phòng");

            CangCanResponse result = service.update(request);

            assertEquals("Cảng Cạn Cập Nhật", result.getTenCangCan());
            assertEquals("CHO_PHE_DUYET", result.getTrangThaiPheDuyet());
            assertEquals("CC-001", result.getMaCangCan()); // code unchanged
            verify(lichSuThayDoiService).recordChanges(eq("CangCan"), any(), any(), any(), any());
        }

        @Test
        @DisplayName("F-027: update — entity not found → EntityNotFoundException")
        void update_notFound_throws() {
            UpdateCangCanRequest request = new UpdateCangCanRequest();
            request.setId(testId);
            when(cangCanRepository.findById(testId)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class, () -> service.update(request));
        }

        @Test
        @DisplayName("F-028: softDelete — entity found, soft-deleted and saved")
        void softDelete_setsDeletedAt() {
            when(cangCanRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(cangCanRepository.save(any())).thenReturn(testEntity);

            service.softDelete(testId);

            assertNotNull(testEntity.getDeletedAt());
            verify(cangCanRepository).save(testEntity);
        }

        @Test
        @DisplayName("F-028: softDelete — entity not found → EntityNotFoundException")
        void softDelete_notFound_throws() {
            when(cangCanRepository.findById(testId)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
        }

        private CreateCangCanRequest buildCreateRequest(String maCangCan, String tenCangCan) {
            CreateCangCanRequest req = new CreateCangCanRequest();
            req.setMaCangCan(maCangCan);
            req.setTenCangCan(tenCangCan);
            req.setTinhThanhPho("Hà Nội");
            req.setTrangThaiHoatDong("HIEN_HANH");
            return req;
        }
    }

    // ── CangCanApprovalService tests ─────────────────────────────────────────

    @Nested
    @DisplayName("CangCanApprovalService — approval state machine")
    class ApprovalTests {

        @InjectMocks
        private CangCanApprovalService approvalService;

        @Mock
        private CangCanRepository cangCanRepository;

        @Mock
        private ApprovalWorkflowService approvalWorkflowService;

        @Mock
        private CangBenNotificationService notificationService;

        @Mock
        private LichSuThayDoiRepository lichSuThayDoiRepository;

        @Mock
        private PheDuyetLogRepository pheDuyetLogRepository;

        private UUID testId;
        private CangCan testEntity;

        @BeforeEach
        void setUp() {
            testId = UUID.randomUUID();
            testEntity = new CangCan();
            ReflectionTestUtils.setField(testEntity, "id", testId);
            testEntity.setMaCangCan("CC-001");
            testEntity.setTenCangCan("Cảng Cạn Demo");
            testEntity.setTrangThaiPheDuyet("CHO_PHE_DUYET");
        }

        @Test
        @DisplayName("F-030: approve — null reason → sets DUOC_PHE_DUYET")
        void approve_setsApprovedStatus() {
            when(cangCanRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(cangCanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            approvalService.approve(testId, "admin-user", null);

            assertEquals("DUOC_PHE_DUYET", testEntity.getTrangThaiPheDuyet());
            verify(approvalWorkflowService).approve(eq("CHO_PHE_DUYET"), eq("CangCan"),
                    eq(testId.toString()), eq("admin-user"));
            verify(cangCanRepository).save(testEntity);
        }

        @Test
        @DisplayName("F-030: reject — non-blank reason → sets TU_CHOI")
        void reject_setsTuChoiStatus() {
            when(cangCanRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(cangCanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            approvalService.approve(testId, "admin-user", "Hồ sơ chưa đầy đủ");

            assertEquals("TU_CHOI", testEntity.getTrangThaiPheDuyet());
            verify(approvalWorkflowService).reject(eq("CHO_PHE_DUYET"), eq("CangCan"),
                    eq(testId.toString()), eq("admin-user"), eq("Hồ sơ chưa đầy đủ"));
            verify(cangCanRepository).save(testEntity);
        }

        @Test
        @DisplayName("F-030: approve on already approved entity → approvalWorkflowService.approve throws IllegalStateException")
        void doubleApprove_throwsIllegalState() {
            testEntity.setTrangThaiPheDuyet("DUOC_PHE_DUYET");
            when(cangCanRepository.findById(testId)).thenReturn(Optional.of(testEntity));
            when(approvalWorkflowService.approve(eq("DUOC_PHE_DUYET"), any(), any(), any()))
                    .thenThrow(new IllegalStateException("Cannot approve: state is DUOC_PHE_DUYET"));

            assertThrows(IllegalStateException.class,
                    () -> approvalService.approve(testId, "admin-user", null));
        }
    }
}
