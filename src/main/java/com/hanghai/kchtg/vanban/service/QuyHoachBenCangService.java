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
public class QuyHoachBenCangService {

    private final QuyHoachBenCangRepository quyHoachBenCangRepository;
    private final HamMucQuyHoachRepository hamMucQuyHoachRepository;
    private final FileQuyHoachRepository fileQuyHoachRepository;
    private final TraCuuLogRepository traCuuLogRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public QuyHoachBenCangResponse create(QuyHoachBenCangCreateRequest request) {
        log.info("Creating QuyHoachBenCang: {}", request.getTenDoAn());
        QuyHoachBenCang qh = QuyHoachBenCang.builder()
                .tenDoAn(request.getTenDoAn())
                .coQuanPheDuyet(request.getCoQuanPheDuyet())
                .ngayPheDuyet(request.getNgayPheDuyet())
                .phamViApDung(request.getPhamViApDung())
                .tiLeBanDo(request.getTiLeBanDo())
                .tinhTrang(request.getTinhTrang())
                .duongDanFile(request.getDuongDanFile())
                .nguoiTao(request.getNguoiTao())
                .build();
        return toResponse(quyHoachBenCangRepository.save(qh));
    }

    @Transactional(readOnly = true)
    public QuyHoachBenCangResponse getById(Long id) {
        QuyHoachBenCang qh = quyHoachBenCangRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));
        return toResponse(qh);
    }

    @Transactional(readOnly = true)
    public List<QuyHoachBenCangResponse> findAll() {
        return quyHoachBenCangRepository.findAll(Sort.by(Sort.Direction.DESC, "ngayTao"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<QuyHoachBenCangResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        return quyHoachBenCangRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public QuyHoachBenCangResponse update(Long id, QuyHoachBenCangCreateRequest request) {
        QuyHoachBenCang qh = quyHoachBenCangRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));

        if (request.getTenDoAn() != null) qh.setTenDoAn(request.getTenDoAn());
        if (request.getCoQuanPheDuyet() != null) qh.setCoQuanPheDuyet(request.getCoQuanPheDuyet());
        if (request.getNgayPheDuyet() != null) qh.setNgayPheDuyet(request.getNgayPheDuyet());
        if (request.getPhamViApDung() != null) qh.setPhamViApDung(request.getPhamViApDung());
        if (request.getTiLeBanDo() != null) qh.setTiLeBanDo(request.getTiLeBanDo());
        if (request.getTinhTrang() != null) qh.setTinhTrang(request.getTinhTrang());
        if (request.getDuongDanFile() != null) qh.setDuongDanFile(request.getDuongDanFile());

        return toResponse(quyHoachBenCangRepository.save(qh));
    }

    @Transactional
    public void delete(Long id) {
        if (!quyHoachBenCangRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id);
        }
        quyHoachBenCangRepository.deleteById(id);
        log.info("Deleted QuyHoachBenCang with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<QuyHoachBenCangResponse> findByTinhTrang(TinhTrangQuyHoach tinhTrang) {
        return quyHoachBenCangRepository.findByTinhTrang(tinhTrang)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<QuyHoachBenCangResponse> searchByTenDoAnContaining(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        return quyHoachBenCangRepository.findByTenDoAnContaining(keyword, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<QuyHoachBenCangResponse> findByNgayPheDuyetBetween(LocalDate start, LocalDate end) {
        return quyHoachBenCangRepository.findByNgayPheDuyetBetween(start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Dynamic search with keyword, status, year range (F-133).
     */
    @Transactional(readOnly = true)
    public KetQuaTraCuuResponse traCuu(String keyword, String status, LocalDate yearStart,
                                        LocalDate yearEnd, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        Page<QuyHoachBenCang> result = quyHoachBenCangRepository.findAllWithSearch(
                keyword, status, yearStart, yearEnd, pageable);
        return KetQuaTraCuuResponse.builder()
                .results(result.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    // ── Version Management ────────────────────────────────────────────

    @Transactional
    public QuyHoachBenCangResponse updateTinhTrang(Long id, TinhTrangQuyHoach tinhTrang) {
        QuyHoachBenCang qh = quyHoachBenCangRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));
        qh.setTinhTrang(tinhTrang);
        return toResponse(quyHoachBenCangRepository.save(qh));
    }

    // ── File Management (F-132) ──────────────────────────────────────

    @Transactional
    public FileQuyHoachResponse uploadFile(FileQuyHoachCreateRequest request) {
        log.info("Uploading FileQuyHoach for quyHoachId: {}", request.getQuyHoachId());
        FileQuyHoach fq = FileQuyHoach.builder()
                .quyHoachId(request.getQuyHoachId())
                .tenFile(request.getTenFile())
                .loaiFile(request.getLoaiFile())
                .duongDan(request.getDuongDan())
                .kichThuoc(request.getKichThuoc())
                .build();
        return toFileQuyHoachResponse(fileQuyHoachRepository.save(fq));
    }

    // ── Search Logging (F-133) ───────────────────────────────────────

    @Transactional
    public void logTraCuu(TraCuuLog traCuuLog) {
        log.info("Logging TraCuuLog: {}", traCuuLog.getTuKhoa());
        traCuuLogRepository.save(traCuuLog);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private QuyHoachBenCangResponse toResponse(QuyHoachBenCang qh) {
        List<HamMucQuyHoachResponse> hamMucList = new ArrayList<>();
        if (qh.getHamMucQuyHoach() != null) {
            hamMucList = qh.getHamMucQuyHoach().stream()
                    .map(hm -> HamMucQuyHoachResponse.builder()
                            .id(hm.getId())
                            .tenHamMuc(hm.getTenHamMuc())
                            .donViTinh(hm.getDonViTinh())
                            .giaTriKeHoach(hm.getGiaTriKeHoach())
                            .giaTriThucTe(hm.getGiaTriThucTe())
                            .trangThai(hm.getTrangThai())
                            .build())
                    .collect(Collectors.toList());
        }
        return QuyHoachBenCangResponse.builder()
                .id(qh.getId())
                .tenDoAn(qh.getTenDoAn())
                .coQuanPheDuyet(qh.getCoQuanPheDuyet())
                .ngayPheDuyet(qh.getNgayPheDuyet())
                .phamViApDung(qh.getPhamViApDung())
                .tiLeBanDo(qh.getTiLeBanDo())
                .tinhTrang(qh.getTinhTrang())
                .duongDanFile(qh.getDuongDanFile())
                .nguoiTao(qh.getNguoiTao())
                .ngayTao(qh.getNgayTao())
                .nguoiSuaDoi(qh.getNguoiSuaDoi())
                .ngaySuaDoi(qh.getNgaySuaDoi())
                .hamMucQuyHoach(hamMucList)
                .build();
    }

    private FileQuyHoachResponse toFileQuyHoachResponse(FileQuyHoach fq) {
        return FileQuyHoachResponse.builder()
                .id(fq.getId())
                .quyHoachId(fq.getQuyHoachId())
                .tenFile(fq.getTenFile())
                .loaiFile(fq.getLoaiFile())
                .duongDan(fq.getDuongDan())
                .kichThuoc(fq.getKichThuoc())
                .ngayTaiLen(fq.getNgayTaiLen())
                .nguoiTaiLen(fq.getNguoiTaiLen())
                .build();
    }
}
