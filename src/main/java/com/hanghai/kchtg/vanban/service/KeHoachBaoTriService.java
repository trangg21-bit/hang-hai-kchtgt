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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeHoachBaoTriService {

    private final KeHoachBaoTriRepository keHoachBaoTriRepository;
    private final KetQuaBaoTriRepository ketQuaBaoTriRepository;
    private final BaoCaoBaoTriRepository baoCaoBaoTriRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public KeHoachBaoTriResponse create(KeHoachBaoTriCreateRequest request) {
        log.info("Creating KeHoachBaoTri: {}", request.getThietBi());
        KeHoachBaoTri khbt = KeHoachBaoTri.builder()
                .thietBi(request.getThietBi())
                .loaiBaoTri(request.getLoaiBaoTri())
                .ngayBatDauDuKien(request.getNgayBatDauDuKien())
                .ngayKetThucDuKien(request.getNgayKetThucDuKien())
                .tinhTrang(request.getTinhTrang())
                .chiPhiDuKien(request.getChiPhiDuKien())
                .nguoiTao(request.getNguoiTao())
                .build();
        return toResponse(keHoachBaoTriRepository.save(khbt));
    }

    @Transactional(readOnly = true)
    public KeHoachBaoTriResponse getById(Long id) {
        KeHoachBaoTri khbt = keHoachBaoTriRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + id));
        return toResponse(khbt);
    }

    @Transactional(readOnly = true)
    public List<KeHoachBaoTriResponse> findAll() {
        return keHoachBaoTriRepository.findAll(Sort.by(Sort.Direction.DESC, "ngayTao"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<KeHoachBaoTriResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        return keHoachBaoTriRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public KeHoachBaoTriResponse update(Long id, KeHoachBaoTriCreateRequest request) {
        KeHoachBaoTri khbt = keHoachBaoTriRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + id));

        if (request.getThietBi() != null) khbt.setThietBi(request.getThietBi());
        if (request.getLoaiBaoTri() != null) khbt.setLoaiBaoTri(request.getLoaiBaoTri());
        if (request.getNgayBatDauDuKien() != null) khbt.setNgayBatDauDuKien(request.getNgayBatDauDuKien());
        if (request.getNgayKetThucDuKien() != null) khbt.setNgayKetThucDuKien(request.getNgayKetThucDuKien());
        if (request.getTinhTrang() != null) khbt.setTinhTrang(request.getTinhTrang());
        if (request.getChiPhiDuKien() != null) khbt.setChiPhiDuKien(request.getChiPhiDuKien());

        return toResponse(keHoachBaoTriRepository.save(khbt));
    }

    @Transactional
    public void delete(Long id) {
        if (!keHoachBaoTriRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + id);
        }
        keHoachBaoTriRepository.deleteById(id);
        log.info("Deleted KeHoachBaoTri with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<KeHoachBaoTriResponse> findByThietBi(String thietBi) {
        return keHoachBaoTriRepository.findByThietBi(thietBi)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<KeHoachBaoTriResponse> findByTinhTrang(TinhTrangBaoTri tinhTrang) {
        return keHoachBaoTriRepository.findByTinhTrang(tinhTrang)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<KeHoachBaoTriResponse> findByLoaiBaoTri(LoaiBaoTri loaiBaoTri) {
        return keHoachBaoTriRepository.findByLoaiBaoTri(loaiBaoTri)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<KeHoachBaoTriResponse> findByNgayBatDauDuKienBetween(LocalDate start, LocalDate end) {
        return keHoachBaoTriRepository.findByNgayBatDauDuKienBetween(start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Result Recording ──────────────────────────────────────────────

    @Transactional
    public KetQuaBaoTriResponse recordResult(KetQuaBaoTriRequest request) {
        log.info("Recording KetQuaBaoTri for keHoachId: {}", request.getKeHoachId());
        KeHoachBaoTri khbt = keHoachBaoTriRepository.findById(request.getKeHoachId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + request.getKeHoachId()));

        KetQuaBaoTri kqb = KetQuaBaoTri.builder()
                .keHoach(khbt)
                .thoiGianBatDauThucTe(request.getThoiGianBatDauThucTe())
                .thoiGianKetThucThucTe(request.getThoiGianKetThucThucTe())
                .moTaKetQua(request.getMoTaKetQua())
                .phuTonThayThe(request.getPhuTonThayThe())
                .thoiGianNgungHoatDong(request.getThoiGianNgungHoatDong())
                .nguoiGhiNhan(request.getNguoiGhiNhan())
                .ngayGhiNhan(request.getNgayGhiNhan())
                .build();

        return toKetQuaResponse(ketQuaBaoTriRepository.save(kqb));
    }

    // ── BaoCaoBaoTri ──────────────────────────────────────────────────

    @Transactional
    public BaoCaoBaoTriResponse createBaoCao(BaoCaoBaoTriCreateRequest request) {
        log.info("Creating BaoCaoBaoTri: {}", request.getLoaiBaoCao());
        BaoCaoBaoTri bc = BaoCaoBaoTri.builder()
                .loaiBaoCao(request.getLoaiBaoCao())
                .kyBatDau(request.getKyBatDau())
                .kyKetThuc(request.getKyKetThuc())
                .tongChiPhi(request.getTongChiPhi())
                .duongDanFile(request.getDuongDanFile())
                .nguoiTao(request.getNguoiTao())
                .build();
        return toBaoCaoBaoTriResponse(baoCaoBaoTriRepository.save(bc));
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private KeHoachBaoTriResponse toResponse(KeHoachBaoTri khbt) {
        return KeHoachBaoTriResponse.builder()
                .id(khbt.getId())
                .thietBi(khbt.getThietBi())
                .loaiBaoTri(khbt.getLoaiBaoTri())
                .ngayBatDauDuKien(khbt.getNgayBatDauDuKien())
                .ngayKetThucDuKien(khbt.getNgayKetThucDuKien())
                .tinhTrang(khbt.getTinhTrang())
                .chiPhiDuKien(khbt.getChiPhiDuKien())
                .nguoiTao(khbt.getNguoiTao())
                .ngayTao(khbt.getNgayTao())
                .nguoiSuaDoi(khbt.getNguoiSuaDoi())
                .ngaySuaDoi(khbt.getNgaySuaDoi())
                .build();
    }

    private BaoCaoBaoTriResponse toBaoCaoBaoTriResponse(BaoCaoBaoTri bc) {
        return BaoCaoBaoTriResponse.builder()
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

    private KetQuaBaoTriResponse toKetQuaResponse(KetQuaBaoTri kqb) {
        return KetQuaBaoTriResponse.builder()
                .id(kqb.getId())
                .keHoachId(kqb.getKeHoach().getId())
                .thoiGianBatDauThucTe(kqb.getThoiGianBatDauThucTe())
                .thoiGianKetThucThucTe(kqb.getThoiGianKetThucThucTe())
                .moTaKetQua(kqb.getMoTaKetQua())
                .phuTonThayThe(kqb.getPhuTonThayThe())
                .thoiGianNgungHoatDong(kqb.getThoiGianNgungHoatDong())
                .nguoiGhiNhan(kqb.getNguoiGhiNhan())
                .ngayGhiNhan(kqb.getNgayGhiNhan())
                .build();
    }
}
