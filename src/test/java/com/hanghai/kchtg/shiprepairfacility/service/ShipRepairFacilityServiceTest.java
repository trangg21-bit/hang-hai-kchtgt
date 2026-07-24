package com.hanghai.kchtg.shiprepairfacility.service;

import com.hanghai.kchtg.shiprepairfacility.dto.*;
import com.hanghai.kchtg.shiprepairfacility.entity.*;
import com.hanghai.kchtg.shiprepairfacility.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipRepairFacilityServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private ShipRepairFacilityRepository repository;

    @Mock
    private ShipRepairFacilityAttachmentRepository attachmentRepository;

    @Mock
    private ApprovalHistoryRepository historyRepository;

    @Mock
    private com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @InjectMocks
    private ShipRepairFacilityService service;

    private ShipRepairFacility entity;
    private ShipRepairFacilityCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> {
                    com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatial = new com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject();
                    spatial.setId(UUID.randomUUID());
                    return spatial;
                });
        entity = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        createRequest = ShipRepairFacilityCreateRequest.builder()
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .build();

        // Mock attachmentRepository to return empty list so toResponse doesn't fail
        lenient().when(attachmentRepository.findByShipRepairFacilityId(any(UUID.class))).thenReturn(Collections.emptyList());
    }

    @Test
    void testCreate() {
        ShipRepairFacility saved = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy("user1")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.save(any())).thenReturn(saved);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        ShipRepairFacilityResponse response = service.create(createRequest, "user1");

        assertNotNull(response);
        assertEquals(ShipRepairApprovalStatus.PROPOSED, response.getApprovalStatus());
        assertEquals("user1", response.getCreatedBy());
        verify(repository, times(1)).save(any());
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testGetById() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        ShipRepairFacilityResponse response = service.getById(TEST_ID);

        assertNotNull(response);
        assertEquals("Cơ sở ABC", response.getFacilityName());
        verify(repository, times(1)).findById(TEST_ID);
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(TEST_ID_2)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getById(TEST_ID_2));
    }

    @Test
    void testFindAll() {
        ShipRepairFacility approvedEntity = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.APPROVED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        List<ShipRepairFacility> entities = Arrays.asList(approvedEntity);
        when(repository.findByApprovalStatusAndIsDeletedFalse(ShipRepairApprovalStatus.APPROVED)).thenReturn(entities);

        List<ShipRepairFacilityResponse> responses = service.findAll(0, 20);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(ShipRepairApprovalStatus.APPROVED, responses.get(0).getApprovalStatus());
        verify(repository, times(1)).findByApprovalStatusAndIsDeletedFalse(ShipRepairApprovalStatus.APPROVED);
    }

    @Test
    void testFindAll_Empty() {
        when(repository.findByApprovalStatusAndIsDeletedFalse(ShipRepairApprovalStatus.APPROVED)).thenReturn(Collections.emptyList());

        List<ShipRepairFacilityResponse> responses = service.findAll(0, 20);

        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }

    @Test
    void testUpdate() {
        ShipRepairFacilityUpdateRequest updateReq = ShipRepairFacilityUpdateRequest.builder()
                .facilityName("Cơ sở mới")
                .address("Đà Nẵng")
                .build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        ShipRepairFacility updatedEntity = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("Cơ sở mới")
                .address("Đà Nẵng")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy("test")
                .attachments(new java.util.ArrayList<>())
                .build();
        when(repository.save(any())).thenReturn(updatedEntity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        ShipRepairFacilityResponse response = service.update(TEST_ID, updateReq, "user1");

        assertNotNull(response);
        assertEquals("Cơ sở mới", response.getFacilityName());
        assertEquals("Đà Nẵng", response.getAddress());
        verify(repository, times(1)).save(any());
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testUpdate_ApprovedEntity_RevertsToUnderReview() {
        ShipRepairFacility approvedEntity = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.APPROVED)
                .approvedLevel1(true)
                .approvedLevel2(true)
                .isDeleted(false)
                .createdBy("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        ShipRepairFacilityUpdateRequest updateReqDto = ShipRepairFacilityUpdateRequest.builder()
                .facilityName("ABC mới").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        ShipRepairFacilityResponse response = service.update(TEST_ID, updateReqDto, "user1");

        assertEquals(ShipRepairApprovalStatus.UNDER_REVIEW, response.getApprovalStatus());
        assertEquals("ABC mới", response.getFacilityName());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testUpdate_DeletedEntity_Throws() {
        ShipRepairFacility deletedEntity = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.APPROVED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(true)
                .createdBy("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        ShipRepairFacilityUpdateRequest updateReqDto = ShipRepairFacilityUpdateRequest.builder()
                .facilityName("ABC mới").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(deletedEntity));

        assertThrows(RuntimeException.class, () -> service.update(TEST_ID, updateReqDto, "user1"));
    }

    @Test
    void testUpdate_NotFound() {
        when(repository.findById(TEST_ID_2)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.update(TEST_ID_2, new ShipRepairFacilityUpdateRequest(), "user1"));
    }

    @Test
    void testDelete_ApprovedEntity() {
        ShipRepairFacility approvedEntity = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.APPROVED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        service.delete(TEST_ID, "user1");

        assertTrue(approvedEntity.getIsDeleted());
        verify(repository, times(1)).save(any());
        verify(attachmentRepository, times(1)).deleteByShipRepairFacilityId(TEST_ID);
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testDelete_NotApprovedEntity_Throws() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class, () -> service.delete(TEST_ID, "user1"));
    }

    @Test
    void testDelete_NotFound() {
        when(repository.findById(TEST_ID_2)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.delete(TEST_ID_2, "user1"));
    }

    @Test
    void testApproveC1_Approve() {
        entity.setApprovalStatus(ShipRepairApprovalStatus.PROPOSED);
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        ShipRepairFacilityResponse response = service.approveC1(TEST_ID, req, "admin");

        assertEquals(ShipRepairApprovalStatus.UNDER_REVIEW, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
        assertEquals("admin", entity.getApproverLevel1());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testApproveC1_Reject() {
        entity.setApprovalStatus(ShipRepairApprovalStatus.PROPOSED);
        ApprovalRequest req = ApprovalRequest.builder()
                .quyetDinh("REJECTED")
                .reason("Không đủ điều kiện")
                .build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        ShipRepairFacilityResponse response = service.approveC1(TEST_ID, req, "admin");

        assertEquals(ShipRepairApprovalStatus.REJECTED, entity.getApprovalStatus());
        assertEquals("Không đủ điều kiện", entity.getRejectionReason());
    }

    @Test
    void testApproveC1_WrongStatus_Throws() {
        entity.setApprovalStatus(ShipRepairApprovalStatus.UNDER_REVIEW);
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class, () -> service.approveC1(TEST_ID, req, "admin"));
    }

    @Test
    void testApproveC2_Approve() {
        entity.setApprovalStatus(ShipRepairApprovalStatus.UNDER_REVIEW);
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        ShipRepairFacilityResponse response = service.approveC2(TEST_ID, req, "director");

        assertEquals(ShipRepairApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel2());
        assertEquals("director", entity.getApproverLevel2());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testApproveC2_Reject() {
        entity.setApprovalStatus(ShipRepairApprovalStatus.UNDER_REVIEW);
        ApprovalRequest req = ApprovalRequest.builder()
                .quyetDinh("REJECTED")
                .reason("Không phù hợp")
                .build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        ShipRepairFacilityResponse response = service.approveC2(TEST_ID, req, "director");

        assertEquals(ShipRepairApprovalStatus.REJECTED, entity.getApprovalStatus());
        assertEquals("Không phù hợp", entity.getRejectionReason());
    }

    @Test
    void testApproveC2_WrongStatus_Throws() {
        entity.setApprovalStatus(ShipRepairApprovalStatus.PROPOSED);
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class, () -> service.approveC2(TEST_ID, req, "director"));
    }

    @Test
    void testApproveC2_sameActorAsC1_throwsException() {
        entity.setApprovalStatus(ShipRepairApprovalStatus.UNDER_REVIEW);
        entity.setApprovedLevel1(true);
        entity.setApproverLevel1("user1");
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.approveC2(TEST_ID, req, "user1"));
        assertTrue(ex.getMessage().contains("Nguoi phe duyet C2 khong duoc trung"));
    }

    @Test
    void testGetHistory() {
        ApprovalHistory history = ApprovalHistory.builder()
                .id(1L)
                .shipRepairFacilityId(TEST_ID)
                .approvalLevel(1)
                .status("APPROVED")
                .approvedBy("admin")
                .approvedDate(LocalDateTime.now())
                .reason("Duyệt")
                .build();

        when(historyRepository.findByShipRepairFacilityIdOrderByApprovedDateDesc(TEST_ID)).thenReturn(Arrays.asList(history));

        List<HistoryEntry> entries = service.getHistory(TEST_ID);

        assertNotNull(entries);
        assertEquals(1, entries.size());
        assertEquals("admin", entries.get(0).getApprovedBy());
        assertEquals(1, entries.get(0).getApprovalLevel());
        assertEquals("Duyệt", entries.get(0).getReason());
    }

    @Test
    void testGetHistory_Empty() {
        when(historyRepository.findByShipRepairFacilityIdOrderByApprovedDateDesc(TEST_ID)).thenReturn(Collections.emptyList());

        List<HistoryEntry> entries = service.getHistory(TEST_ID);

        assertNotNull(entries);
        assertTrue(entries.isEmpty());
    }

    @Test
    void testSearch_WithAllNull() {
        when(repository.search(null, null, null, null, null)).thenReturn(Collections.emptyList());

        List<ShipRepairFacilityResponse> responses = service.search(null, null, null, null, null);

        assertNotNull(responses);
        assertTrue(responses.isEmpty());
        verify(repository, times(1)).search(null, null, null, null, null);
    }

    @Test
    void testSearch_WithKeyword() {
        ShipRepairFacility resultEntity = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.APPROVED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.search(null, "%abc%", null, null, null)).thenReturn(Arrays.asList(resultEntity));

        List<ShipRepairFacilityResponse> responses = service.search(null, "ABC", null, null, null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("Cơ sở ABC", responses.get(0).getFacilityName());
        verify(repository, times(1)).search(null, "%abc%", null, null, null);
    }

    @Test
    void testSearch_WithProvince() {
        ShipRepairFacility resultEntity = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .province("Đà Nẵng")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.APPROVED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.search(null, null, "%đà nẵng%", null, null)).thenReturn(Arrays.asList(resultEntity));

        List<ShipRepairFacilityResponse> responses = service.search(null, null, "Đà Nẵng", null, null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("Đà Nẵng", responses.get(0).getProvince());
    }

    @Test
    void testSearch_WithApprovalStatus() {
        ShipRepairFacility resultEntity = ShipRepairFacility.builder()
                .id(TEST_ID)
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.REJECTED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.search(null, null, null, ShipRepairApprovalStatus.REJECTED, null)).thenReturn(Arrays.asList(resultEntity));

        List<ShipRepairFacilityResponse> responses = service.search(null, null, null, "REJECTED", null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(ShipRepairApprovalStatus.REJECTED, responses.get(0).getApprovalStatus());
    }
}
