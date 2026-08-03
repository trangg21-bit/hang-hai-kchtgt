package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.HoSoXuLyTaiSan;
import com.hanghai.kchtg.assetmovement.entity.LoaiXuLy;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiHoSoXuLy;
import com.hanghai.kchtg.assetmovement.repository.HoSoXuLyTaiSanRepository;
import com.hanghai.kchtg.assetmovement.service.HoSoXuLyTaiSanService;
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
@DisplayName("HoSoXuLyTaiSanService Unit Tests")
public class HoSoXuLyTaiSanServiceTest {

    @InjectMocks
    private HoSoXuLyTaiSanService service;

    @Mock
    private HoSoXuLyTaiSanRepository repository;

    private UUID testId;
    private UUID taiSanId;
    private HoSoXuLyTaiSan testEntity;
    private HoSoXuLyTaiSanRequest testRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        taiSanId = UUID.randomUUID();

        testEntity = HoSoXuLyTaiSan.builder()
                .id(testId)
                .taiSanId(taiSanId)
                .loaiXuLy(LoaiXuLy.DIEU_CHUYEN)
                .moTa("Điều chuyển phao tiêu về cảng")
                .trangThai(TrangThaiHoSoXuLy.CHO_PHE_DUYET)
                .deleted(false)
                .build();
        testEntity.setCreatedAt(Instant.now());
        testEntity.setUpdatedAt(Instant.now());

        testRequest = new HoSoXuLyTaiSanRequest();
        testRequest.setTaiSanId(taiSanId);
        testRequest.setTenTaiSan("Phao tiêu số 12");
        testRequest.setLoaiXuLy("DIEU_CHUYEN");
        testRequest.setLyDoXuLy("Điều chuyển phao tiêu về cảng");
        testRequest.setMoTa("Điều chuyển phao tiêu về cảng");
    }

    @Test
    @DisplayName("create should save and return response successfully")
    void create_ShouldSaveAndReturnResponse() {
        when(repository.save(any(HoSoXuLyTaiSan.class))).thenReturn(testEntity);

        HoSoXuLyTaiSanResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals(taiSanId, response.getTaiSanId());
        assertEquals("DIEU_CHUYEN", response.getLoaiXuLy());
        assertEquals("CHO_PHE_DUYET", response.getTrangThaiHoSo());
        verify(repository, times(1)).save(any(HoSoXuLyTaiSan.class));
    }

    @Test
    @DisplayName("getById should return response when id exists")
    void getById_ShouldReturnResponse_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        HoSoXuLyTaiSanResponse response = service.getById(testId);

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
        Page<HoSoXuLyTaiSan> page = new PageImpl<>(List.of(testEntity));
        when(repository.findAll(pageable)).thenReturn(page);

        Page<HoSoXuLyTaiSanResponse> result = service.findAll(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(testId, result.getContent().get(0).getId());
        verify(repository, times(1)).findAll(pageable);
    }

    @Test
    @DisplayName("update should modify and save entity when id exists")
    void update_ShouldModifyAndSave_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(HoSoXuLyTaiSan.class))).thenReturn(testEntity);

        testRequest.setMoTa("Mô tả thay đổi");
        HoSoXuLyTaiSanResponse response = service.update(testId, testRequest);

        assertNotNull(response);
        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(HoSoXuLyTaiSan.class));
    }

    @Test
    @DisplayName("update should throw EntityNotFoundException when id does not exist")
    void update_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(testId, testRequest));
        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(HoSoXuLyTaiSan.class));
    }

    @Test
    @DisplayName("delete should soft-delete entity when id exists")
    void delete_ShouldSoftDelete_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(HoSoXuLyTaiSan.class))).thenReturn(testEntity);

        assertDoesNotThrow(() -> service.delete(testId));

        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(HoSoXuLyTaiSan.class));
        assertTrue(testEntity.getDeleted());
    }

    @Test
    @DisplayName("delete should throw EntityNotFoundException when id does not exist")
    void delete_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.delete(testId));

        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(HoSoXuLyTaiSan.class));
    }
}
