package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.LuuPheDuyetRequest;
import com.hanghai.kchtg.assetmovement.dto.LuuPheDuyetResponse;
import com.hanghai.kchtg.assetmovement.entity.LuuPheDuyet;
import com.hanghai.kchtg.assetmovement.entity.KetQuaPheDuyet;
import com.hanghai.kchtg.assetmovement.repository.LuuPheDuyetRepository;
import com.hanghai.kchtg.assetmovement.service.LuuPheDuyetService;
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
class LuuPheDuyetServiceTest {

    @InjectMocks
    private LuuPheDuyetService service;

    @Mock
    private LuuPheDuyetRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-127: create — returns created approval record")
    void testCreate() {
        LuuPheDuyetRequest request = new LuuPheDuyetRequest();
        request.setYeuCauId(UUID.randomUUID());
        request.setKetQua("PHE_DUYET");

        LuuPheDuyet entity = LuuPheDuyet.builder()
                .id(entityId)
                .yeuCauId(request.getYeuCauId())
                .ketQua(KetQuaPheDuyet.PHE_DUYET)
                .deleted(false)
                .build();

        when(repo.save(any(LuuPheDuyet.class))).thenReturn(entity);

        LuuPheDuyetResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-127: getById — returns approval record by ID")
    void testGetById() {
        LuuPheDuyet entity = LuuPheDuyet.builder()
                .id(entityId)
                .ketQua(KetQuaPheDuyet.PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        LuuPheDuyetResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals("PHE_DUYET", result.getKetQua());
    }

    @Test
    @DisplayName("F-127: findAll — returns paginated approval records")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        LuuPheDuyet entity = LuuPheDuyet.builder()
                .id(UUID.randomUUID())
                .ketQua(KetQuaPheDuyet.PHE_DUYET)
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<LuuPheDuyetResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-127: update — returns updated approval record")
    void testUpdate() {
        LuuPheDuyet existing = LuuPheDuyet.builder()
                .id(entityId)
                .ketQua(KetQuaPheDuyet.PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        LuuPheDuyet updated = LuuPheDuyet.builder()
                .id(entityId)
                .ketQua(KetQuaPheDuyet.PHE_DUYET)
                .build();
        when(repo.save(any(LuuPheDuyet.class))).thenReturn(updated);

        LuuPheDuyetResponse result = service.update(entityId, new LuuPheDuyetRequest());

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-127: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-127: findByYeuCauId — returns records filtered by request ID")
    void testFindByYeuCauId() {
        UUID yeuCauId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        LuuPheDuyet entity = LuuPheDuyet.builder()
                .id(UUID.randomUUID())
                .yeuCauId(yeuCauId)
                .ketQua(KetQuaPheDuyet.PHE_DUYET)
                .build();
        when(repo.findByYeuCauId(yeuCauId, pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<LuuPheDuyetResponse> result = service.findByYeuCauId(yeuCauId, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-127: findByKetQua — returns records filtered by result")
    void testFindByKetQua() {
        Pageable pageable = PageRequest.of(0, 20);
        LuuPheDuyet entity = LuuPheDuyet.builder()
                .id(UUID.randomUUID())
                .ketQua(KetQuaPheDuyet.PHE_DUYET)
                .build();
        when(repo.findByKetQua(KetQuaPheDuyet.PHE_DUYET, pageable))
                .thenReturn(new PageImpl<>(List.of(entity)));

        Page<LuuPheDuyetResponse> result = service.findByKetQua(KetQuaPheDuyet.PHE_DUYET, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("PHE_DUYET", result.getContent().get(0).getKetQua());
    }
}
