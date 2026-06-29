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
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeHoachVanHanhService {

    private final KeHoachVanHanhRepository keHoachVanHanhRepository;
    private final VanHanhChiTietRepository vanHanhChiTietRepository;
    private final BaoCaoVanHanhRepository baoCaoVanHanhRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public KeHoachVanHanhResponse create(KeHoachVanHanhCreateRequest request) {
        log.info("Creating KeHoachVanHanh: {}", request.getCauCang());
        KeHoachVanHanh kh = KeHoachVanHanh.builder()
                .ngayVanHanh(request.getNgayVanHanh())
                .cauCang(request.getCauCang())
                .thietBi(request.getThietBi())
                .thoiGianBatDau(request.getThoiGianBatDau())
                .thoiGianKetThuc(request.getThoiGianKetThuc())
                .tinhTrang(request.getTinhTrang())
                .nguoiTao(request.getNguoiTao())
                .build();
        return toResponse(keHoachVanHanhRepository.save(kh));
    }

    @Transactional(readOnly = true)
    public KeHoachVanHanhResponse getById(Long id) {
        KeHoachVanHanh kh = keHoachVanHanhRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + id));
        return toResponse(kh);
    }

    @Transactional(readOnly = true)
    public List<KeHoachVanHanhResponse> findAll() {
        return keHoachVanHanhRepository.findAll(Sort.by(Sort.Direction.DESC, "ngayTao"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<KeHoachVanHanhResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        return keHoachVanHanhRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public KeHoachVanHanhResponse update(Long id, KeHoachVanHanhCreateRequest request) {
        KeHoachVanHanh kh = keHoachVanHanhRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + id));

        if (request.getNgayVanHanh() != null) kh.setNgayVanHanh(request.getNgayVanHanh());
        if (request.getCauCang() != null) kh.setCauCang(request.getCauCang());
        if (request.getThietBi() != null) kh.setThietBi(request.getThietBi());
        if (request.getThoiGianBatDau() != null) kh.setThoiGianBatDau(request.getThoiGianBatDau());
        if (request.getThoiGianKetThuc() != null) kh.setThoiGianKetThuc(request.getThoiGianKetThuc());
        if (request.getTinhTrang() != null) kh.setTinhTrang(request.getTinhTrang());

        return toResponse(keHoachVanHanhRepository.save(kh));
    }

    @Transactional
    public void delete(Long id) {
        if (!keHoachVanHanhRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + id);
        }
        keHoachVanHanhRepository.deleteById(id);
        log.info("Deleted KeHoachVanHanh with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<KeHoachVanHanhResponse> findByNgayVanHanh(LocalDate ngayVanHanh) {
        return keHoachVanHanhRepository.findByNgayVanHanh(ngayVanHanh)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<KeHoachVanHanhResponse> findByTinhTrang(TinhTrangVanHanh tinhTrang) {
        return keHoachVanHanhRepository.findByTinhTrang(tinhTrang)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<KeHoachVanHanhResponse> findByCauCang(String cauCang) {
        return keHoachVanHanhRepository.findByCauCang(cauCang)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<KeHoachVanHanhResponse> findByThietBi(String thietBi) {
        return keHoachVanHanhRepository.findByThietBi(thietBi)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Check for scheduling conflicts (F-129).
     * Returns true if any conflicting schedule is found.
     */
    @Transactional(readOnly = true)
    public boolean hasConflictSchedule(LocalDate ngayVanHanh, LocalTime thoiGianBatDau,
                                        LocalTime thoiGianKetThuc, String cauCang, String thietBi) {
        List<KeHoachVanHanh> conflicts = keHoachVanHanhRepository.findConflictSchedule(
                ngayVanHanh, thoiGianBatDau, thoiGianKetThuc, cauCang, thietBi);
        return !conflicts.isEmpty();
    }

    @Transactional
    public BaoCaoVanHanhResponse createBaoCao(BaoCaoVanHanhCreateRequest request) {
        log.info("Creating BaoCaoVanHanh: {}", request.getLoaiBaoCao());
        BaoCaoVanHanh bc = BaoCaoVanHanh.builder()
                .loaiBaoCao(request.getLoaiBaoCao())
                .kyBatDau(request.getKyBatDau())
                .kyKetThuc(request.getKyKetThuc())
                .tongChiPhi(request.getTongChiPhi())
                .duongDanFile(request.getDuongDanFile())
                .nguoiTao(request.getNguoiTao())
                .build();
        return toBaoCaoVanHanhResponse(baoCaoVanHanhRepository.save(bc));
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private KeHoachVanHanhResponse toResponse(KeHoachVanHanh kh) {
        List<VanHanhChiTietResponse> chiTietList = new ArrayList<>();
        if (kh.getVanHanhChiTiet() != null) {
            chiTietList = kh.getVanHanhChiTiet().stream()
                    .map(vh -> VanHanhChiTietResponse.builder()
                            .id(vh.getId())
                            .moTa(vh.getMoTa())
                            .sanLuongDuKien(vh.getSanLuongDuKien())
                            .sanLuongThucTe(vh.getSanLuongThucTe())
                            .ghiChu(vh.getGhiChu())
                            .build())
                    .collect(Collectors.toList());
        }
        return KeHoachVanHanhResponse.builder()
                .id(kh.getId())
                .ngayVanHanh(kh.getNgayVanHanh())
                .cauCang(kh.getCauCang())
                .thietBi(kh.getThietBi())
                .thoiGianBatDau(kh.getThoiGianBatDau())
                .thoiGianKetThuc(kh.getThoiGianKetThuc())
                .tinhTrang(kh.getTinhTrang())
                .nguoiTao(kh.getNguoiTao())
                .ngayTao(kh.getNgayTao())
                .nguoiSuaDoi(kh.getNguoiSuaDoi())
                .ngaySuaDoi(kh.getNgaySuaDoi())
                .vanHanhChiTiet(chiTietList)
                .build();
    }

    private BaoCaoVanHanhResponse toBaoCaoVanHanhResponse(BaoCaoVanHanh bc) {
        return BaoCaoVanHanhResponse.builder()
                .id(bc.getId())
                .loaiBaoCao(bc.getLoaiBaoCao())
                .kyBatDau(bc.getKyBatDau())
                .kyKetThuc(bc.getKyKetThuc())
                .tongChiPhi(bc.getTongChiPhi())
                .duongDanFile(bc.getDuongDanFile())
                .nguoiTao(bc.getNguoiTao())
                .ngayTao(bc.getNgayTao())
                .build();
    }
}
