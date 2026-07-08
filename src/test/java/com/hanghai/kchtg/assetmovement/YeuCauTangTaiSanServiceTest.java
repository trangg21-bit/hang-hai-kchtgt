package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.YeuCauTangTaiSan;
import com.hanghai.kchtg.assetmovement.repository.YeuCauTangTaiSanRepository;
import com.hanghai.kchtg.assetmovement.service.YeuCauTangTaiSanService;
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

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("YeuCauTangTaiSanService Unit Tests")
public class YeuCauTangTaiSanServiceTest {

    @InjectMocks
    private YeuCauTangTaiSanService service;

    @Mock
    private YeuCauTangTaiSanRepository repository;

    @Mock
    private com.hanghai.kchtg.assetmovement.repository.TaiSanKCHTRepository taiSanRepository;

    @Mock
    private com.hanghai.kchtg.user.repository.UserRepository userRepository;

    private UUID testId;
    private UUID taiSanId;
    private YeuCauTangTaiSan testEntity;
    private YeuCauTangTaiSanRequest testRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        taiSanId = UUID.randomUUID();

        testEntity = YeuCauTangTaiSan.builder()
                .id(testId)
                .taiSanId(taiSanId)
                .moTa("Mua mới thiết bị định vị GPS")
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .deleted(false)
                .build();
        testEntity.setCreatedAt(Instant.now());
        testEntity.setUpdatedAt(Instant.now());

        testRequest = new YeuCauTangTaiSanRequest();
        testRequest.setTaiSanId(taiSanId);

        lenient().when(taiSanRepository.findById(any())).thenReturn(Optional.empty());

        testRequest.setTenTaiSan("GPS Receiver");
        testRequest.setLyDo("Mua mới thiết bị định vị GPS");
        testRequest.setSoLuong(2);
        testRequest.setDonViTinh("Bộ");
        testRequest.setMaSoTang("TANG-001");
    }

    @Test
    @DisplayName("create should save and return response successfully")
    void create_ShouldSaveAndReturnResponse() {
        when(repository.save(any(YeuCauTangTaiSan.class))).thenReturn(testEntity);

        YeuCauTangTaiSanResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals(taiSanId, response.getTaiSanId());
        assertEquals("Mua mới thiết bị định vị GPS", response.getLyDo());
        assertEquals("CHO_PHE_DUYET", response.getTrangThai());
        verify(repository, times(1)).save(any(YeuCauTangTaiSan.class));
    }

    @Test
    @DisplayName("getById should return response when id exists")
    void getById_ShouldReturnResponse_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        YeuCauTangTaiSanResponse response = service.getById(testId);

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
        Page<YeuCauTangTaiSan> page = new PageImpl<>(List.of(testEntity));
        when(repository.findAll(pageable)).thenReturn(page);

        Page<YeuCauTangTaiSanResponse> result = service.findAll(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(testId, result.getContent().get(0).getId());
        verify(repository, times(1)).findAll(pageable);
    }

    @Test
    @DisplayName("update should modify and save entity when id exists")
    void update_ShouldModifyAndSave_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(YeuCauTangTaiSan.class))).thenReturn(testEntity);

        testRequest.setLyDo("Lý do thay đổi");
        YeuCauTangTaiSanResponse response = service.update(testId, testRequest);

        assertNotNull(response);
        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(YeuCauTangTaiSan.class));
    }

    @Test
    @DisplayName("update should throw EntityNotFoundException when id does not exist")
    void update_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(testId, testRequest));
        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(YeuCauTangTaiSan.class));
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
