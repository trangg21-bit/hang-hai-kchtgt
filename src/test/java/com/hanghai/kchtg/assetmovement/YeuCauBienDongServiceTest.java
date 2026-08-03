package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongResponse;
import com.hanghai.kchtg.assetmovement.entity.LoaiBienDong;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.YeuCauBienDong;
import com.hanghai.kchtg.assetmovement.repository.YeuCauBienDongRepository;
import com.hanghai.kchtg.assetmovement.service.YeuCauBienDongService;
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
@DisplayName("YeuCauBienDongService Unit Tests")
public class YeuCauBienDongServiceTest {

    @InjectMocks
    private YeuCauBienDongService service;

    @Mock
    private YeuCauBienDongRepository repository;

    private UUID testId;
    private YeuCauBienDong testEntity;
    private YeuCauBienDongRequest testRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();

        testEntity = YeuCauBienDong.builder()
                .id(testId)
                .loaiBienDong(LoaiBienDong.TANG)
                .tieuDe("Mua mới phao tiêu số 15")
                .moTa("Đề xuất mua mới phao tiêu số 15")
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .deleted(false)
                .build();
        testEntity.setCreatedAt(Instant.now());
        testEntity.setUpdatedAt(Instant.now());

        testRequest = new YeuCauBienDongRequest();
        testRequest.setLoaiBienDong("TANG");
        testRequest.setTenTaiSan("Mua mới phao tiêu số 15");
        testRequest.setSoLuong(1);
        testRequest.setMoTa("Đề xuất mua mới phao tiêu số 15");
    }

    @Test
    @DisplayName("create should save and return response successfully")
    void create_ShouldSaveAndReturnResponse() {
        when(repository.save(any(YeuCauBienDong.class))).thenReturn(testEntity);

        YeuCauBienDongResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals("TANG", response.getLoaiBienDong());
        assertEquals("Mua mới phao tiêu số 15", response.getTenTaiSan());
        assertEquals("CHO_PHE_DUYET", response.getTrangThai());
        verify(repository, times(1)).save(any(YeuCauBienDong.class));
    }

    @Test
    @DisplayName("getById should return response when id exists")
    void getById_ShouldReturnResponse_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        YeuCauBienDongResponse response = service.getById(testId);

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
        Page<YeuCauBienDong> page = new PageImpl<>(List.of(testEntity));
        when(repository.findAll(pageable)).thenReturn(page);

        Page<YeuCauBienDongResponse> result = service.findAll(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(testId, result.getContent().get(0).getId());
        verify(repository, times(1)).findAll(pageable);
    }

    @Test
    @DisplayName("update should modify and save entity when id exists")
    void update_ShouldModifyAndSave_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(YeuCauBienDong.class))).thenReturn(testEntity);

        testRequest.setMoTa("Mô tả thay đổi");
        YeuCauBienDongResponse response = service.update(testId, testRequest);

        assertNotNull(response);
        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(YeuCauBienDong.class));
    }

    @Test
    @DisplayName("update should throw EntityNotFoundException when id does not exist")
    void update_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(testId, testRequest));
        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(YeuCauBienDong.class));
    }

    @Test
    @DisplayName("delete should soft-delete entity when id exists")
    void delete_ShouldSoftDelete_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(YeuCauBienDong.class))).thenReturn(testEntity);

        assertDoesNotThrow(() -> service.delete(testId));

        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(YeuCauBienDong.class));
        assertTrue(testEntity.getDeleted());
    }

    @Test
    @DisplayName("delete should throw EntityNotFoundException when id does not exist")
    void delete_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.delete(testId));

        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(YeuCauBienDong.class));
    }
}
