package com.hanghai.kchtg.cctv.service;

import com.hanghai.kchtg.cctv.dto.CreateCctvRequest;
import com.hanghai.kchtg.cctv.dto.CctvResponse;
import com.hanghai.kchtg.cctv.dto.UpdateCctvRequest;
import com.hanghai.kchtg.cctv.entity.Cctv;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Business-rule tests of CctvService around the 2-level approval flow:
 * create default DRAFT, edit-lock while awaiting approval (N09/BR-019),
 * re-approval after editing APPROVED records, DRAFT-only delete (T13).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CctvServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private CctvRepository cctvRepository;
    @Mock
    private OrgUnitCacheService orgUnitCacheService;
    @Mock
    private OrgUnitScopeService orgUnitScopeService;
    @Mock
    private ChangeHistoryService changeHistoryService;
    @Mock
    private UserResolverService userResolverService;
    @Mock
    private VtsSystemRepository vtsSystemRepository;
    @Mock
    private RadarStationRepository radarStationRepository;
    @Mock
    private AttachmentRepository attachmentRepository;
    @Mock
    private InfrastructureHistoryRepository historyRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CctvService service;

    private Cctv entity;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        ReflectionTestUtils.setField(service, "approvalService", approvalService);

        when(userRepository.findById(any())).thenReturn(Optional.empty());

        User principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        // Constructor 3 tham số → authenticated=true để SecurityUtils.getCurrentUserId() trả USER_ID.
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        entity = Cctv.builder()
                .id(ID)
                .deviceCode("CCTV-001")
                .deviceName("Camera cảng Hải Phòng")
                .quantity(1)
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(USER_ID)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private CreateCctvRequest createRequest(String action) {
        CreateCctvRequest req = new CreateCctvRequest();
        req.setDeviceCode("CCTV-001");
        req.setDeviceName("Camera cảng Hải Phòng");
        req.setQuantity(1);
        req.setAction(action);
        return req;
    }

    @Test
    void createWithoutActionDefaultsToDraft() {
        when(cctvRepository.existsByDeviceCode("CCTV-001")).thenReturn(false);
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CctvResponse result = service.create(createRequest(null));

        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
    }

    @Test
    void createWithSubmitActionGoesToPending() {
        when(cctvRepository.existsByDeviceCode("CCTV-001")).thenReturn(false);
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CctvResponse result = service.create(createRequest("submit"));

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
    }

    @Test
    void updateApprovedRecordForcesReApproval() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("Camera cảng Hải Phòng (nâng cấp)");

        CctvResponse result = service.update(req);

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        assertEquals(ApprovalStatus.PENDING_APPROVAL, entity.getApprovalStatus());
    }

    @Test
    void updatePendingRecordIsLocked() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("X");

        assertThrows(IllegalStateException.class, () -> service.update(req));
    }

    @Test
    void updateApprovedLevel1RecordIsLocked() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);

        assertThrows(IllegalStateException.class, () -> service.update(req));
    }

    @Test
    void softDeleteOnlyFromDraft() {
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(ID);

        // deleteDraft chuyển sang ARCHIVED (T13) rồi soft delete.
        assertEquals(ApprovalStatus.ARCHIVED, entity.getApprovalStatus());
        verify(cctvRepository).save(entity);
    }

    @Test
    void softDeleteApprovedRecordIsBlocked() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));

        assertThrows(IllegalStateException.class, () -> service.softDelete(ID));
    }
}
