package com.hanghai.kchtg.vanban.service;

import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.*;
import com.hanghai.kchtg.vanban.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DieuChinhQuyHoachService {

    private final DieuChinhQuyHoachRepository dieuChinhQuyHoachRepository;
    private final PheDuyetDieuChinhRepository pheDuyetDieuChinhRepository;
    private final QuyHoachBenCangService quyHoachBenCangService;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public DieuChinhQuyHoachResponse create(DieuChinhQuyHoachCreateRequest request) {
        log.info("Creating DieuChinhQuyHoach for quyHoachId: {}", request.getQuyHoachId());
        DieuChinhQuyHoach dc = DieuChinhQuyHoach.builder()
                .quyHoach(QuyHoachBenCang.builder().id(request.getQuyHoachId()).build())
                .loaiDieuChinh(request.getLoaiDieuChinh())
                .lyDo(request.getLyDo())
                .moTaChiTiet(request.getMoTaChiTiet())
                .phamViAnhHuong(request.getPhamViAnhHuong())
                .tinhTrang(request.getTinhTrang() != null ? request.getTinhTrang() : TinhTrangDieuChinh.CHO_DOI_PHUY)
                .nguoiDangKy(request.getNguoiDangKy())
                .ngayDangKy(request.getNgayDangKy())
                .build();
        return toResponse(dieuChinhQuyHoachRepository.save(dc));
    }

    @Transactional(readOnly = true)
    public DieuChinhQuyHoachResponse getById(Long id) {
        DieuChinhQuyHoach dc = dieuChinhQuyHoachRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điều chỉnh với id: " + id));
        return toResponse(dc);
    }

    @Transactional(readOnly = true)
    public List<DieuChinhQuyHoachResponse> findAll() {
        return dieuChinhQuyHoachRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DieuChinhQuyHoachResponse> findByQuyHoachId(Long quyHoachId) {
        return dieuChinhQuyHoachRepository.findByQuyHoachId(quyHoachId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public DieuChinhQuyHoachResponse update(Long id, DieuChinhQuyHoachCreateRequest request) {
        DieuChinhQuyHoach dc = dieuChinhQuyHoachRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điều chỉnh với id: " + id));

        if (request.getLoaiDieuChinh() != null) dc.setLoaiDieuChinh(request.getLoaiDieuChinh());
        if (request.getLyDo() != null) dc.setLyDo(request.getLyDo());
        if (request.getMoTaChiTiet() != null) dc.setMoTaChiTiet(request.getMoTaChiTiet());
        if (request.getPhamViAnhHuong() != null) dc.setPhamViAnhHuong(request.getPhamViAnhHuong());
        if (request.getTinhTrang() != null) dc.setTinhTrang(request.getTinhTrang());
        if (request.getNguoiDangKy() != null) dc.setNguoiDangKy(request.getNguoiDangKy());
        if (request.getNgayDangKy() != null) dc.setNgayDangKy(request.getNgayDangKy());

        return toResponse(dieuChinhQuyHoachRepository.save(dc));
    }

    @Transactional
    public void delete(Long id) {
        if (!dieuChinhQuyHoachRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy điều chỉnh với id: " + id);
        }
        dieuChinhQuyHoachRepository.deleteById(id);
        log.info("Deleted DieuChinhQuyHoach with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DieuChinhQuyHoachResponse> findByTinhTrang(TinhTrangDieuChinh tinhTrang) {
        return dieuChinhQuyHoachRepository.findByTinhTrang(tinhTrang)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Approval Workflow (F-134) ─────────────────────────────────────

    @Transactional
    public PheDuyetDieuChinhResponse addApproval(Long dieuChinhId, PheDuyetDieuChinhRequest request) {
        log.info("Adding PheDuyetDieuChinh for dieuChinhId: {}", dieuChinhId);
        DieuChinhQuyHoach dc = dieuChinhQuyHoachRepository.findById(dieuChinhId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điều chỉnh với id: " + dieuChinhId));

        PheDuyetDieuChinh pd = PheDuyetDieuChinh.builder()
                .dieuChinh(dc)
                .capPheDuyet(request.getCapPheDuyet())
                .trangThai(request.getTrangThai())
                .nguoiPheDuyet(request.getNguoiPheDuyet())
                .ngayPheDuyet(request.getNgayPheDuyet())
                .ghiChu(request.getGhiChu())
                .build();

        PheDuyetDieuChinh saved = pheDuyetDieuChinhRepository.save(pd);

        // Auto-update adjustment status to approved if approval status is positive
        if ("DA_DUOC_PHE_DUYET".equals(request.getTrangThai())) {
            dc.setTinhTrang(TinhTrangDieuChinh.DA_DUOC_PHE_DUYET);
            dieuChinhQuyHoachRepository.save(dc);
        }

        return toPheDuyetResponse(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private DieuChinhQuyHoachResponse toResponse(DieuChinhQuyHoach dc) {
        List<PheDuyetDieuChinhResponse> pheDuyetList = new ArrayList<>();
        if (dc.getPheDuyetDieuChinh() != null) {
            pheDuyetList = dc.getPheDuyetDieuChinh().stream()
                    .map(pd -> PheDuyetDieuChinhResponse.builder()
                            .id(pd.getId())
                            .dieuChinhId(pd.getDieuChinh().getId())
                            .capPheDuyet(pd.getCapPheDuyet())
                            .trangThai(pd.getTrangThai())
                            .nguoiPheDuyet(pd.getNguoiPheDuyet())
                            .ngayPheDuyet(pd.getNgayPheDuyet())
                            .ghiChu(pd.getGhiChu())
                            .build())
                    .collect(Collectors.toList());
        }
        return DieuChinhQuyHoachResponse.builder()
                .id(dc.getId())
                .quyHoachId(dc.getQuyHoach().getId())
                .loaiDieuChinh(dc.getLoaiDieuChinh())
                .lyDo(dc.getLyDo())
                .moTaChiTiet(dc.getMoTaChiTiet())
                .phamViAnhHuong(dc.getPhamViAnhHuong())
                .tinhTrang(dc.getTinhTrang())
                .nguoiDangKy(dc.getNguoiDangKy())
                .ngayDangKy(dc.getNgayDangKy())
                .ngaySuaDoi(dc.getNgaySuaDoi())
                .pheDuyetDieuChinh(pheDuyetList)
                .build();
    }

    private PheDuyetDieuChinhResponse toPheDuyetResponse(PheDuyetDieuChinh pd) {
        return PheDuyetDieuChinhResponse.builder()
                .id(pd.getId())
                .dieuChinhId(pd.getDieuChinh().getId())
                .capPheDuyet(pd.getCapPheDuyet())
                .trangThai(pd.getTrangThai())
                .nguoiPheDuyet(pd.getNguoiPheDuyet())
                .ngayPheDuyet(pd.getNgayPheDuyet())
                .ghiChu(pd.getGhiChu())
                .build();
    }
}
