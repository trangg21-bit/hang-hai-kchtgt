package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.BaoCaoKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiBaoCao;
import com.hanghai.kchtg.assetmovement.repository.BaoCaoKiemKeRepository;
import com.hanghai.kchtg.assetmovement.service.BaoCaoKiemKeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BaoCaoKiemKeServiceTest {

    @InjectMocks
    private BaoCaoKiemKeService service;

    @Mock
    private BaoCaoKiemKeRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-125: create — returns created report")
    void testCreate() {
        BaoCaoKiemKeRequest request = new BaoCaoKiemKeRequest();
        request.setKeHoachId(UUID.randomUUID());

        BaoCaoKiemKe entity = BaoCaoKiemKe.builder()
                .id(entityId)
                .keHoachId(request.getKeHoachId())
                .trangThai(TrangThaiBaoCao.CHO_PHE_DUYET)
                .deleted(false)
                .build();

        when(repo.save(any(BaoCaoKiemKe.class))).thenReturn(entity);

        BaoCaoKiemKeResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-125: getById — returns report by ID")
    void testGetById() {
        BaoCaoKiemKe entity = BaoCaoKiemKe.builder()
                .id(entityId)
                .trangThai(TrangThaiBaoCao.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        BaoCaoKiemKeResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-125: findAll — returns paginated reports")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        BaoCaoKiemKe entity = BaoCaoKiemKe.builder()
                .id(UUID.randomUUID())
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<BaoCaoKiemKeResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-125: update — returns updated report")
    void testUpdate() {
        BaoCaoKiemKe existing = BaoCaoKiemKe.builder()
                .id(entityId)
                .trangThai(TrangThaiBaoCao.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        BaoCaoKiemKe updated = BaoCaoKiemKe.builder()
                .id(entityId)
                .trangThai(TrangThaiBaoCao.CHO_PHE_DUYET)
                .build();
        when(repo.save(any(BaoCaoKiemKe.class))).thenReturn(updated);

        BaoCaoKiemKeResponse result = service.update(entityId, new BaoCaoKiemKeRequest());

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-125: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-125: findByKeHoachId — returns reports filtered by plan ID")
    void testFindByKeHoachId() {
        UUID keHoachId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        BaoCaoKiemKe entity = BaoCaoKiemKe.builder()
                .id(UUID.randomUUID())
                .keHoachId(keHoachId)
                .build();
        when(repo.findByKeHoachId(keHoachId, pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<BaoCaoKiemKeResponse> result = service.findByKeHoachId(keHoachId, pageable);

        assertEquals(1, result.getTotalElements());
    }
}
