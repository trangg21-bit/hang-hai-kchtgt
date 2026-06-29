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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VanBanPhapLyService {

    private final VanBanPhapLyRepository vanBanPhapLyRepository;
    private final TaiLieuDinhKemRepository taiLieuDinhKemRepository;
    private final TimKiemLogRepository timKiemLogRepository;
    private final KetQuaTimKiemRepository ketQuaTimKiemRepository;
    private final GoiYTimKiemRepository goiYTimKiemRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public VanBanPhapLyResponse create(VanBanPhapLyCreateRequest request) {
        log.info("Creating VanBanPhapLy: {}", request.getTenVanBan());

        VanBanPhapLy vb = VanBanPhapLy.builder()
                .tenVanBan(request.getTenVanBan())
                .soHieu(request.getSoHieu())
                .coQuanBanHanh(request.getCoQuanBanHanh())
                .ngayBanHanh(request.getNgayBanHanh())
                .ngayCoHieuLuc(request.getNgayCoHieuLuc())
                .ngayHetHieuLuc(request.getNgayHetHieuLuc())
                .loaiVanBan(request.getLoaiVanBan())
                .linhVucApDung(request.getLinhVucApDung())
                .tinhTrangHieuLuc(request.getTinhTrangHieuLuc())
                .nguoiTao(request.getNguoiTao())
                .build();

        VanBanPhapLy saved = vanBanPhapLyRepository.save(vb);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public VanBanPhapLyResponse getById(Long id) {
        VanBanPhapLy vb = vanBanPhapLyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy văn bản với id: " + id));
        return toResponse(vb);
    }

    @Transactional(readOnly = true)
    public List<VanBanPhapLyResponse> findAll() {
        return vanBanPhapLyRepository.findAll(Sort.by(Sort.Direction.DESC, "ngayTao"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<VanBanPhapLyResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        return vanBanPhapLyRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public VanBanPhapLyResponse update(Long id, VanBanPhapLyCreateRequest request) {
        VanBanPhapLy vb = vanBanPhapLyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy văn bản với id: " + id));

        if (request.getTenVanBan() != null) vb.setTenVanBan(request.getTenVanBan());
        if (request.getSoHieu() != null) vb.setSoHieu(request.getSoHieu());
        if (request.getCoQuanBanHanh() != null) vb.setCoQuanBanHanh(request.getCoQuanBanHanh());
        if (request.getNgayBanHanh() != null) vb.setNgayBanHanh(request.getNgayBanHanh());
        if (request.getNgayCoHieuLuc() != null) vb.setNgayCoHieuLuc(request.getNgayCoHieuLuc());
        if (request.getNgayHetHieuLuc() != null) vb.setNgayHetHieuLuc(request.getNgayHetHieuLuc());
        if (request.getLoaiVanBan() != null) vb.setLoaiVanBan(request.getLoaiVanBan());
        if (request.getLinhVucApDung() != null) vb.setLinhVucApDung(request.getLinhVucApDung());
        if (request.getTinhTrangHieuLuc() != null) vb.setTinhTrangHieuLuc(request.getTinhTrangHieuLuc());

        return toResponse(vanBanPhapLyRepository.save(vb));
    }

    @Transactional
    public void delete(Long id) {
        if (!vanBanPhapLyRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy văn bản với id: " + id);
        }
        vanBanPhapLyRepository.deleteById(id);
        log.info("Deleted VanBanPhapLy with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VanBanPhapLyResponse> findByTinhTrangHieuLuc(TinhTrangHieuLuc tinhTrang) {
        return vanBanPhapLyRepository.findByTinhTrangHieuLuc(tinhTrang)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VanBanPhapLyResponse> findByLoaiVanBan(LoaiVanBan loai) {
        return vanBanPhapLyRepository.findByLoaiVanBan(loai)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VanBanPhapLyResponse> searchByTenVanBanContaining(String keyword) {
        return vanBanPhapLyRepository.findByTenVanBanContaining(keyword)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VanBanPhapLyResponse> searchByCoQuanBanHanhContaining(String coQuan) {
        return vanBanPhapLyRepository.findByCoQuanBanHanhContaining(coQuan)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Dynamic search with keyword, issuing body, type, status, year range (F-135).
     */
    @Transactional(readOnly = true)
    public KetQuaTimKiemResponse searchDocuments(String keyword, String coQuan, String loai,
                                                  String tinhTrang, LocalDate yearStart,
                                                  LocalDate yearEnd, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        Page<VanBanPhapLy> result = vanBanPhapLyRepository.searchDocuments(
                keyword, coQuan, loai, tinhTrang, yearStart, yearEnd, pageable);
        return KetQuaTimKiemResponse.builder()
                .results(result.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    /**
     * Log search query (F-134).
     */
    @Transactional
    public void logTimKiem(TimKiemLog timKiemLog) {
        log.info("Logging search: {}", timKiemLog.getTuKhoa());
        timKiemLogRepository.save(timKiemLog);
    }

    /**
     * Get search suggestions for a keyword (F-134).
     */
    @Transactional(readOnly = true)
    public List<GoiYTimKiemResponse> getGoiYTimKiem(String keyword) {
        List<GoiYTimKiem> goiYList = goiYTimKiemRepository.findByTuKhoaContainingIgnoreCase(keyword);
        return goiYList.stream().map(g -> GoiYTimKiemResponse.builder()
                        .id(g.getId())
                        .tuKhoa(g.getTuKhoa())
                        .soLuongTim(g.getSoLuongTim())
                        .lanCuoiTim(g.getLanCuoiTim())
                        .build())
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private VanBanPhapLyResponse toResponse(VanBanPhapLy vb) {
        List<TaiLieuDinhKemResponse> taiLieuList = new ArrayList<>();
        if (vb.getTaiLieuDinhKem() != null) {
            taiLieuList = vb.getTaiLieuDinhKem().stream()
                    .map(tl -> TaiLieuDinhKemResponse.builder()
                            .id(tl.getId())
                            .tenTaiLieu(tl.getTenTaiLieu())
                            .duongDan(tl.getDuongDan())
                            .kichThuoc(tl.getKichThuoc())
                            .ngayTaiLen(tl.getNgayTaiLen())
                            .build())
                    .collect(Collectors.toList());
        }
        return VanBanPhapLyResponse.builder()
                .id(vb.getId())
                .tenVanBan(vb.getTenVanBan())
                .soHieu(vb.getSoHieu())
                .coQuanBanHanh(vb.getCoQuanBanHanh())
                .ngayBanHanh(vb.getNgayBanHanh())
                .ngayCoHieuLuc(vb.getNgayCoHieuLuc())
                .ngayHetHieuLuc(vb.getNgayHetHieuLuc())
                .loaiVanBan(vb.getLoaiVanBan())
                .linhVucApDung(vb.getLinhVucApDung())
                .tinhTrangHieuLuc(vb.getTinhTrangHieuLuc())
                .nguoiTao(vb.getNguoiTao())
                .ngayTao(vb.getNgayTao())
                .nguoiSuaDoi(vb.getNguoiSuaDoi())
                .ngaySuaDoi(vb.getNgaySuaDoi())
                .taiLieuDinhKem(taiLieuList)
                .build();
    }
}
