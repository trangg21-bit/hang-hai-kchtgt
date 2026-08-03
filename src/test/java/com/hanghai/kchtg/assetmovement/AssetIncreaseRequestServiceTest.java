package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.AssetIncreaseRequestRequest;
import com.hanghai.kchtg.assetmovement.dto.AssetIncreaseRequestResponse;
import com.hanghai.kchtg.assetmovement.entity.AssetIncreaseRequest;
import com.hanghai.kchtg.assetmovement.entity.RequestStatus;
import com.hanghai.kchtg.assetmovement.repository.AssetIncreaseRequestRepository;
import com.hanghai.kchtg.assetmovement.service.AssetIncreaseRequestService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AssetIncreaseRequestService Unit Tests")
public class AssetIncreaseRequestServiceTest {

    @InjectMocks
    private AssetIncreaseRequestService service;

    @Mock
    private AssetIncreaseRequestRepository repository;

    @Mock
    private com.hanghai.kchtg.assetmovement.repository.InfraAssetRepository assetRepository;

    @Mock
    private com.hanghai.kchtg.user.repository.UserRepository userRepository;

    private UUID testId;
    private UUID assetId;
    private AssetIncreaseRequest testEntity;
    private AssetIncreaseRequestRequest testRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        assetId = UUID.randomUUID();

        testEntity = AssetIncreaseRequest.builder()
                .id(testId)
                .assetId(assetId)
                .description("Mua mới thiết bị định vị GPS")
                .status(RequestStatus.PENDING)

                .build();
        testEntity.setCreatedAt(java.time.LocalDateTime.now());
        testEntity.setUpdatedAt(java.time.LocalDateTime.now());

        testRequest = new AssetIncreaseRequestRequest();
        testRequest.setAssetId(assetId);

        lenient().when(assetRepository.findById(any())).thenReturn(Optional.empty());

        testRequest.setAssetName("GPS Receiver");
        testRequest.setReason("Mua mới thiết bị định vị GPS");
        testRequest.setQuantity(2);
        testRequest.setUnitOfMeasure("Bộ");
        testRequest.setIncreaseCode("INCREASE-001");
    }

    @Test
    @DisplayName("create should save and return response successfully")
    void create_ShouldSaveAndReturnResponse() {
        when(repository.save(any(AssetIncreaseRequest.class))).thenReturn(testEntity);

        AssetIncreaseRequestResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals(assetId, response.getAssetId());
        assertEquals("Mua mới thiết bị định vị GPS", response.getReason());
        assertEquals("PENDING", response.getStatus());
        verify(repository, times(1)).save(any(AssetIncreaseRequest.class));
    }

    @Test
    @DisplayName("getById should return response when id exists")
    void getById_ShouldReturnResponse_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        AssetIncreaseRequestResponse response = service.getById(testId);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        verify(repository, times(1)).findById(testId);
    }

    @Test
    @DisplayName("getById should throw EntityNotFoundException when id does not exist")
    void getById_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
        verify(repository, times(1)).findById(testId);
    }

    @Test
    @DisplayName("findAll should return page of responses")
    void findAll_ShouldReturnPageOfResponses() {
        Pageable pageable = mock(Pageable.class);
        Page<AssetIncreaseRequest> page = new PageImpl<>(List.of(testEntity));
        when(repository.findAll(pageable)).thenReturn(page);

        Page<AssetIncreaseRequestResponse> result = service.findAll(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(testId, result.getContent().get(0).getId());
        verify(repository, times(1)).findAll(pageable);
    }

    @Test
    @DisplayName("update should modify and save entity when id exists")
    void update_ShouldModifyAndSave_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(AssetIncreaseRequest.class))).thenReturn(testEntity);

        testRequest.setReason("Lý do thay đổi");
        AssetIncreaseRequestResponse response = service.update(testId, testRequest);

        assertNotNull(response);
        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(AssetIncreaseRequest.class));
    }

    @Test
    @DisplayName("update should throw EntityNotFoundException when id does not exist")
    void update_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(testId, testRequest));
        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(AssetIncreaseRequest.class));
    }

    @Test
    @DisplayName("delete should remove entity when id exists")
    void delete_ShouldRemove_WhenIdExists() {
        when(repository.existsById(testId)).thenReturn(true);
        doNothing().when(repository).deleteById(testId);

        assertDoesNotThrow(() -> service.delete(testId));

        verify(repository, times(1)).existsById(testId);
        verify(repository, times(1)).deleteById(testId);
    }

    @Test
    @DisplayName("delete should throw EntityNotFoundException when id does not exist")
    void delete_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.existsById(testId)).thenReturn(false);

        assertThrows(EntityNotFoundException.class, () -> service.delete(testId));

        verify(repository, times(1)).existsById(testId);
        verify(repository, never()).deleteById(any(UUID.class));
    }
}
