package com.hanghai.kchtg.aissystem.service;

import com.hanghai.kchtg.aissystem.dto.AisSystemRequest;
import com.hanghai.kchtg.aissystem.dto.AisSystemResponse;
import com.hanghai.kchtg.aissystem.entity.AisSystem;
import com.hanghai.kchtg.aissystem.repository.AisSystemRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.UnitOfMeasure;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
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
class AisSystemServiceTest {

    private static final UUID AIS_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID CENTER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID OPERATING_ORG_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID USER_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");

    @Mock
    private AisSystemRepository repository;

    @Mock
    private VtsOperationCenterRepository vtsOperationCenterRepository;

    @Mock
    private VtsSystemRepository vtsSystemRepository;

    @Mock
    private OrgUnitRepository orgUnitRepository;

    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;

    @Mock
    private ApprovalHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InfrastructureApprovalService approvalService;

    @Mock
    private OrgUnitScopeService orgUnitScopeService;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @InjectMocks
    private AisSystemService service;

    private AisSystem entity;
    private AisSystemRequest request;

    @BeforeEach
    void setUp() {
        VtsOperationCenter center = VtsOperationCenter.builder().id(CENTER_ID).name("Trung tâm VTS").build();
        OrgUnit orgUnit = OrgUnit.builder().name("Cảng vụ").build();
        orgUnit.setId(ORG_UNIT_ID);
        OrgUnit opOrg = OrgUnit.builder().name("Đơn vị khai thác").build();
        opOrg.setId(OPERATING_ORG_ID);

        lenient().when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        lenient().when(orgUnitScopeService.resolveSubtreeIds(any())).thenReturn(List.of(ORG_UNIT_ID));
        lenient().when(vtsOperationCenterRepository.findByIdAndDeletedAtIsNull(CENTER_ID)).thenReturn(Optional.of(center));
        lenient().when(vtsOperationCenterRepository.findById(CENTER_ID)).thenReturn(Optional.of(center));
        lenient().when(orgUnitRepository.findById(ORG_UNIT_ID)).thenReturn(Optional.of(orgUnit));
        lenient().when(orgUnitRepository.findById(OPERATING_ORG_ID)).thenReturn(Optional.of(opOrg));
        lenient().when(attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(any(), any())).thenReturn(Collections.emptyList());

        entity = AisSystem.builder()
                .id(AIS_ID)
                .code("AIS-000001")
                .name("Thiết bị AIS Bờ Hải Phòng")
                .vtsOperationCenterId(CENTER_ID)
                .operatingOrgId(OPERATING_ORG_ID)
                .orgUnitId(ORG_UNIT_ID)
                .provinceId(1)
                .unitOfMeasure(UnitOfMeasure.SET)
                .quantity(2)
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.DRAFT)
                .build();

        request = AisSystemRequest.builder()
                .code("AIS-000001")
                .name("Thiết bị AIS Bờ Hải Phòng")
                .vtsOperationCenterId(CENTER_ID)
                .operatingOrgId(OPERATING_ORG_ID)
                .orgUnitId(ORG_UNIT_ID)
                .provinceId(1)
                .unitOfMeasure(UnitOfMeasure.SET)
                .quantity(2)
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .build();
    }

    @Test
    void testCreateSuccess() {
        when(repository.existsByCodeAndDeletedAtIsNull("AIS-000001")).thenReturn(false);
        when(repository.save(any())).thenReturn(entity);

        AisSystemResponse response = service.create(request, USER_ID);

        assertNotNull(response);
        assertEquals("AIS-000001", response.getCode());
        assertEquals("Thiết bị AIS Bờ Hải Phòng", response.getName());
        verify(repository).save(any(AisSystem.class));
        verify(historyRepository).save(any());
    }

    @Test
    void testCreateDuplicateCodeThrowsException() {
        when(repository.existsByCodeAndDeletedAtIsNull("AIS-000001")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(request, USER_ID));
        verify(repository, never()).save(any());
    }

    @Test
    void testGetByIdSuccess() {
        when(repository.findByIdAndDeletedAtIsNull(AIS_ID)).thenReturn(Optional.of(entity));

        AisSystemResponse response = service.getById(AIS_ID);

        assertNotNull(response);
        assertEquals(AIS_ID, response.getId());
        assertEquals("AIS-000001", response.getCode());
    }

    @Test
    void testUpdateSuccess() {
        when(repository.findByIdAndDeletedAtIsNull(AIS_ID)).thenReturn(Optional.of(entity));
        when(repository.existsByCodeAndIdNotAndDeletedAtIsNull("AIS-000001", AIS_ID)).thenReturn(false);
        when(repository.save(any())).thenReturn(entity);

        request.setName("Thiết bị AIS Mới");
        AisSystemResponse response = service.update(AIS_ID, request, USER_ID);

        assertNotNull(response);
        verify(repository).save(entity);
    }

    @Test
    void testDeleteSuccess() {
        when(repository.findByIdAndDeletedAtIsNull(AIS_ID)).thenReturn(Optional.of(entity));

        service.delete(AIS_ID, USER_ID);

        assertNotNull(entity.getDeletedAt());
        assertEquals(USER_ID, entity.getDeletedBy());
        verify(repository).save(entity);
        verify(historyRepository).save(any());
    }

    @Test
    void testSubmitApproval() {
        when(repository.findByIdAndDeletedAtIsNull(AIS_ID)).thenReturn(Optional.of(entity));

        service.submit(AIS_ID, USER_ID);

        verify(approvalService).submit(entity, InfrastructureType.AIS_SYSTEM, USER_ID);
        verify(repository).save(entity);
    }

    @Test
    void testApproveC1() {
        when(repository.findByIdAndDeletedAtIsNull(AIS_ID)).thenReturn(Optional.of(entity));

        service.approveC1(AIS_ID, "Duyệt C1", "Đủ điều kiện", USER_ID);

        verify(approvalService).approveC1(entity, InfrastructureType.AIS_SYSTEM, "Duyệt C1", "Đủ điều kiện", USER_ID);
        verify(repository).save(entity);
    }

    @Test
    void testApproveC2() {
        when(repository.findByIdAndDeletedAtIsNull(AIS_ID)).thenReturn(Optional.of(entity));

        service.approveC2(AIS_ID, "Duyệt C2", "Đồng ý ban hành", USER_ID);

        verify(approvalService).approveC2(entity, InfrastructureType.AIS_SYSTEM, "Duyệt C2", "Đồng ý ban hành", USER_ID);
        verify(repository).save(entity);
    }

    @Test
    void testReject() {
        when(repository.findByIdAndDeletedAtIsNull(AIS_ID)).thenReturn(Optional.of(entity));

        service.reject(AIS_ID, "Sai thông tin", USER_ID);

        verify(approvalService).approveC1(entity, InfrastructureType.AIS_SYSTEM, ApprovalStatus.REJECTED.name(), "Sai thông tin", USER_ID);
        verify(repository).save(entity);
    }

    @Test
    void testSearch() {
        Page<AisSystem> page = new PageImpl<>(List.of(entity));
        when(repository.search(anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);

        Page<?> result = service.search("Hải Phòng", ORG_UNIT_ID, CENTER_ID, OPERATING_ORG_ID, 1, ConditionStatus.OPERATIONAL, ApprovalStatus.DRAFT, PageRequest.of(0, 20));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}
