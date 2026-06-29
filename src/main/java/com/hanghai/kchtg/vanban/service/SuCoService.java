package com.hanghai.kchtg.vanban.service;

import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.*;
import com.hanghai.kchtg.vanban.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SuCoService {

    private final SuCoRepository suCoRepository;
    private final TienDoXuLyRepository tienDoXuLyRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public SuCoResponse create(SuCoCreateRequest request) {
        log.info("Creating SuCo: {}", request.getViTri());
        SuCo sc = SuCo.builder()
                .viTri(request.getViTri())
                .moTa(request.getMoTa())
                .mucDoNghiemTrong(request.getMucDoNghiemTrong())
                .tinhTrangXuLy(request.getTinhTrangXuLy() != null ? request.getTinhTrangXuLy() : TinhTrangXuLy.TIEP_NHAN)
                .nguoiBaoCao(request.getNguoiBaoCao())
                .build();
        return toResponse(suCoRepository.save(sc));
    }

    @Transactional(readOnly = true)
    public SuCoResponse getById(Long id) {
        SuCo sc = suCoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + id));
        return toResponse(sc);
    }

    @Transactional(readOnly = true)
    public List<SuCoResponse> findAll() {
        return suCoRepository.findAll(Sort.by(Sort.Direction.DESC, "ngayTao"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<SuCoResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        return suCoRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public SuCoResponse update(Long id, SuCoCreateRequest request) {
        SuCo sc = suCoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + id));

        if (request.getViTri() != null) sc.setViTri(request.getViTri());
        if (request.getMoTa() != null) sc.setMoTa(request.getMoTa());
        if (request.getMucDoNghiemTrong() != null) sc.setMucDoNghiemTrong(request.getMucDoNghiemTrong());
        if (request.getTinhTrangXuLy() != null) sc.setTinhTrangXuLy(request.getTinhTrangXuLy());
        if (request.getNguoiBaoCao() != null) sc.setNguoiBaoCao(request.getNguoiBaoCao());

        return toResponse(suCoRepository.save(sc));
    }

    @Transactional
    public void delete(Long id) {
        if (!suCoRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy sự cố với id: " + id);
        }
        suCoRepository.deleteById(id);
        log.info("Deleted SuCo with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SuCoResponse> findByTinhTrangXuLy(TinhTrangXuLy tinhTrang) {
        return suCoRepository.findByTinhTrangXuLy(tinhTrang)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SuCoResponse> findByMucDoNghiemTrong(MucDoNghiemTrong mucDo) {
        return suCoRepository.findByMucDoNghiemTrong(mucDo)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<SuCoResponse> searchByViTriContaining(String viTri, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        return suCoRepository.findByViTriContaining(viTri, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<SuCoResponse> searchByMoTaContaining(String moTa, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        return suCoRepository.findByMoTaContaining(moTa, pageable).map(this::toResponse);
    }

    // ── Progress Updates ──────────────────────────────────────────────

    @Transactional
    public TienDoXuLyResponse addProgress(TienDoXuLyRequest request) {
        log.info("Adding TienDoXuLy for suCoId: {}", request.getSuCoId());
        SuCo sc = suCoRepository.findById(request.getSuCoId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + request.getSuCoId()));

        TienDoXuLy td = TienDoXuLy.builder()
                .suCo(sc)
                .thoiGianCapNhat(request.getThoiGianCapNhat() != null ? request.getThoiGianCapNhat() : LocalDateTime.now())
                .moTaTienDo(request.getMoTaTienDo())
                .nguoiCapNhat(request.getNguoiCapNhat())
                .build();

        return toTienDoResponse(tienDoXuLyRepository.save(td));
    }

    @Transactional(readOnly = true)
    public List<TienDoXuLyResponse> getProgressBySuCo(Long suCoId) {
        return tienDoXuLyRepository.findBySuCoId(suCoId).stream()
                .map(this::toTienDoResponse).collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private SuCoResponse toResponse(SuCo sc) {
        List<TienDoXuLyResponse> progressList = new ArrayList<>();
        if (sc.getTienDoXuLy() != null) {
            progressList = sc.getTienDoXuLy().stream()
                    .map(t -> TienDoXuLyResponse.builder()
                            .id(t.getId())
                            .suCoId(t.getSuCo().getId())
                            .thoiGianCapNhat(t.getThoiGianCapNhat())
                            .moTaTienDo(t.getMoTaTienDo())
                            .nguoiCapNhat(t.getNguoiCapNhat())
                            .build())
                    .collect(Collectors.toList());
        }
        return SuCoResponse.builder()
                .id(sc.getId())
                .thoiGianPhatHien(sc.getThoiGianPhatHien())
                .viTri(sc.getViTri())
                .mucDoNghiemTrong(sc.getMucDoNghiemTrong())
                .moTa(sc.getMoTa())
                .tinhTrangXuLy(sc.getTinhTrangXuLy())
                .nguoiBaoCao(sc.getNguoiBaoCao())
                .ngayTao(sc.getNgayTao())
                .nguoiSuaDoi(sc.getNguoiSuaDoi())
                .ngaySuaDoi(sc.getNgaySuaDoi())
                .tienDoXuLy(progressList)
                .build();
    }

    private TienDoXuLyResponse toTienDoResponse(TienDoXuLy td) {
        return TienDoXuLyResponse.builder()
                .id(td.getId())
                .suCoId(td.getSuCo().getId())
                .thoiGianCapNhat(td.getThoiGianCapNhat())
                .moTaTienDo(td.getMoTaTienDo())
                .nguoiCapNhat(td.getNguoiCapNhat())
                .build();
    }
}
