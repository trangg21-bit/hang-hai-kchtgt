package com.hanghai.kchtg.vtsoperationcenter.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterRequest;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterResponse;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VtsOperationCenterServiceTest {

    private static final UUID CENTER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID VTS_SYSTEM_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID USER_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @Mock
    private VtsOperationCenterRepository repository;

    @Mock
    private VtsSystemRepository vtsSystemRepository;

    @Mock
    private PortRepository portRepository;

    @Mock
    private OrgUnitRepository orgUnitRepository;

    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InfrastructureApprovalService approvalService;

    @Mock
    private OrgUnitScopeService orgUnitScopeService;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    // toResponse lấy tên cảng / đơn vị từ cache dùng chung thay vì truy vấn riêng.
    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;

    @Mock
    private com.hanghai.kchtg.port.service.PortCacheService portCacheService;

    @InjectMocks
    private VtsOperationCenterService service;

    private VtsOperationCenter entity;
    private VtsOperationCenterRequest request;

    @BeforeEach
    void setUp() {
        VtsSystem vtsSystem = VtsSystem.builder().id(VTS_SYSTEM_ID).systemName("Hệ thống VTS Hải Phòng").build();
        OrgUnit orgUnit = OrgUnit.builder().name("Cảng vụ Hàng hải Hải Phòng").build();
        orgUnit.setId(ORG_UNIT_ID);

        lenient().when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        lenient().when(orgUnitScopeService.resolveSubtreeIds(any())).thenReturn(List.of(ORG_UNIT_ID));
        lenient().when(vtsSystemRepository.findById(VTS_SYSTEM_ID)).thenReturn(Optional.of(vtsSystem));
        lenient().when(orgUnitRepository.findById(ORG_UNIT_ID)).thenReturn(Optional.of(orgUnit));
        lenient().when(attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(any(), any())).thenReturn(Collections.emptyList());

        entity = VtsOperationCenter.builder()
                .id(CENTER_ID)
                .code("TT-000001")
                .name("Trung tâm VTS Hải Phòng")
                .vtsSystemId(VTS_SYSTEM_ID)
                .orgUnitId(ORG_UNIT_ID)
                .provinceId(1)
                .detailedLocation("Số 1 Hoàng Diệu, Hải Phòng")
                .coverage("Luồng Hải Phòng")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.DRAFT)
                .build();

        request = VtsOperationCenterRequest.builder()
                .code("TT-000001")
                .name("Trung tâm VTS Hải Phòng")
                .vtsSystemId(VTS_SYSTEM_ID)
                .orgUnitId(ORG_UNIT_ID)
                .provinceId(1)
                .detailedLocation("Số 1 Hoàng Diệu, Hải Phòng")
                .coverage("Luồng Hải Phòng")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .build();
    }

    @Test
    void testCreateSuccess() {
        when(repository.existsByCodeAndDeletedAtIsNull("TT-000001")).thenReturn(false);
        when(repository.save(any())).thenReturn(entity);

        VtsOperationCenterResponse response = service.create(request, USER_ID);

        assertNotNull(response);
        assertEquals("TT-000001", response.getCode());
        assertEquals("Trung tâm VTS Hải Phòng", response.getName());
        verify(repository).save(any(VtsOperationCenter.class));
        verify(historyRepository).save(any());
    }

    @Test
    void testCreateDuplicateCodeThrowsException() {
        when(repository.existsByCodeAndDeletedAtIsNull("TT-000001")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(request, USER_ID));
        verify(repository, never()).save(any());
    }

    @Test
    void testGetByIdSuccess() {
        when(repository.findByIdAndDeletedAtIsNull(CENTER_ID)).thenReturn(Optional.of(entity));

        VtsOperationCenterResponse response = service.getById(CENTER_ID);

        assertNotNull(response);
        assertEquals(CENTER_ID, response.getId());
        assertEquals("TT-000001", response.getCode());
    }

    @Test
    void testUpdateSuccess() {
        when(repository.findByIdAndDeletedAtIsNull(CENTER_ID)).thenReturn(Optional.of(entity));
        when(repository.existsByCodeAndIdNotAndDeletedAtIsNull("TT-000001", CENTER_ID)).thenReturn(false);
        when(repository.save(any())).thenReturn(entity);

        request.setName("Trung tâm VTS Hải Phòng Mới");
        VtsOperationCenterResponse response = service.update(CENTER_ID, request, USER_ID);

        assertNotNull(response);
        verify(repository).save(entity);
    }

    @Test
    void testDeleteSuccess() {
        when(repository.findByIdAndDeletedAtIsNull(CENTER_ID)).thenReturn(Optional.of(entity));

        service.delete(CENTER_ID, USER_ID);

        assertNotNull(entity.getDeletedAt());
        assertEquals(USER_ID, entity.getDeletedBy());
        verify(repository).save(entity);
        verify(historyRepository).save(any());
    }

    @Test
    void testSubmitApproval() {
        when(repository.findByIdAndDeletedAtIsNull(CENTER_ID)).thenReturn(Optional.of(entity));

        service.submit(CENTER_ID, USER_ID);

        verify(approvalService).submit(entity, InfrastructureType.VTS_OPERATION_CENTER, USER_ID);
        verify(repository).save(entity);
    }

    @Test
    void testApproveC1() {
        when(repository.findByIdAndDeletedAtIsNull(CENTER_ID)).thenReturn(Optional.of(entity));

        service.approveC1(CENTER_ID, "Duyệt C1", "Đủ điều kiện", USER_ID);

        verify(approvalService).approveC1(entity, InfrastructureType.VTS_OPERATION_CENTER, "Duyệt C1", "Đủ điều kiện", USER_ID);
        verify(repository).save(entity);
    }

    @Test
    void testApproveC2() {
        when(repository.findByIdAndDeletedAtIsNull(CENTER_ID)).thenReturn(Optional.of(entity));

        service.approveC2(CENTER_ID, "Duyệt C2", "Đồng ý ban hành", USER_ID);

        verify(approvalService).approveC2(entity, InfrastructureType.VTS_OPERATION_CENTER, "Duyệt C2", "Đồng ý ban hành", USER_ID);
        verify(repository).save(entity);
    }

    @Test
    void testReject() {
        when(repository.findByIdAndDeletedAtIsNull(CENTER_ID)).thenReturn(Optional.of(entity));

        service.reject(CENTER_ID, "Thiếu hồ sơ", USER_ID);

        verify(approvalService).approveC1(entity, InfrastructureType.VTS_OPERATION_CENTER, ApprovalStatus.REJECTED.name(), "Thiếu hồ sơ", USER_ID);
        verify(repository).save(entity);
    }

    @Test
    void testSearch() {
        Page<VtsOperationCenter> page = new PageImpl<>(List.of(entity));
        when(repository.search(anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);

        Page<?> result = service.search("Hải Phòng", ORG_UNIT_ID, VTS_SYSTEM_ID, null, 1, ConditionStatus.OPERATIONAL, ApprovalStatus.DRAFT, null, null, PageRequest.of(0, 20));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}
