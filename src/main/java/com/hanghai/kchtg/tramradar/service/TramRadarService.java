package com.hanghai.kchtg.tramradar.service;

import com.hanghai.kchtg.tramradar.dto.*;
import com.hanghai.kchtg.tramradar.entity.*;
import com.hanghai.kchtg.tramradar.repository.PheDuyetLichSuRepository;
import com.hanghai.kchtg.tramradar.repository.TramRadarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TramRadarService {

    private final TramRadarRepository repository;
    private final PheDuyetLichSuRepository historyRepository;

    public TramRadarResponse create(TramRadarCreateRequest request, String createdBy) {
        TramRadar entity = TramRadar.builder()
                .tenTram(request.getTenTram())
                .viTri(request.getViTri())
                .kinhDo(request.getKinhDo())
                .viDo(request.getViDo())
                .loaiTram(request.getLoaiTram())
                .coTrinh(request.getCoTrinh())
                .dienTichPhaXa(request.getDienTichPhaXa())
                .nguonGoc(request.getNguonGoc())
                .tinhTrang(request.getTinhTrang())
                .trangThai("PROPOSED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao(createdBy)
                .build();

        TramRadar saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(saved.getId())
                .capPheDuyet(0)
                .trangThai("CREATE")
                .nguoiPheDuyet(createdBy)
                .lyDo("Tạo mới trạm radar")
                .build());

        return toResponse(saved);
    }

    public TramRadarResponse getById(Long id) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TramRadar not found: " + id));
        if (entity.getIsDeleted()) {
            throw new RuntimeException("TramRadar is deleted: " + id);
        }
        return toResponse(entity);
    }

    public List<TramRadarResponse> findAll(int page, int size) {
        return repository.findByTrangThaiAndIsDeletedFalse("APPROVED").stream()
                .map(this::toResponse)
                .toList();
    }

    public TramRadarResponse update(Long id, TramRadarUpdateRequest request, String updatedBy) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TramRadar not found: " + id));

        if (entity.getIsDeleted()) {
            throw new RuntimeException("Cannot update deleted record: " + id);
        }

        if ("APPROVED".equals(entity.getTrangThai())) {
            entity.setTrangThai("UNDER_REVIEW");
        }

        if (request.getTenTram() != null) entity.setTenTram(request.getTenTram());
        if (request.getViTri() != null) entity.setViTri(request.getViTri());
        if (request.getKinhDo() != null) entity.setKinhDo(request.getKinhDo());
        if (request.getViDo() != null) entity.setViDo(request.getViDo());
        if (request.getLoaiTram() != null) entity.setLoaiTram(request.getLoaiTram());
        if (request.getCoTrinh() != null) entity.setCoTrinh(request.getCoTrinh());
        if (request.getDienTichPhaXa() != null) entity.setDienTichPhaXa(request.getDienTichPhaXa());
        if (request.getNguonGoc() != null) entity.setNguonGoc(request.getNguonGoc());
        if (request.getTinhTrang() != null) entity.setTinhTrang(request.getTinhTrang());

        TramRadar saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(saved.getId())
                .capPheDuyet(0)
                .trangThai("UPDATE")
                .nguoiPheDuyet(updatedBy)
                .lyDo("Cập nhật thông tin trạm radar")
                .build());

        return toResponse(saved);
    }

    public void delete(Long id, String deletedBy) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TramRadar not found: " + id));

        if (!"APPROVED".equals(entity.getTrangThai())) {
            throw new RuntimeException("Can only delete APPROVED records: " + id);
        }

        entity.setIsDeleted(true);
        repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(entity.getId())
                .capPheDuyet(0)
                .trangThai("DELETE")
                .nguoiPheDuyet(deletedBy)
                .lyDo("Xóa trạm radar")
                .build());
    }

    public TramRadarResponse approveC1(Long id, PheDuyetRequest request, String approvedBy) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TramRadar not found: " + id));

        if (!"PROPOSED".equals(entity.getTrangThai())) {
            throw new RuntimeException("Can only approve PROPOSED records: " + id);
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setTrangThai("REJECTED");
            entity.setLyDoTuChoi(request.getLyDo());
        } else {
            entity.setTrangThai("UNDER_REVIEW");
            entity.setPheDuyetC1(true);
            entity.setNguoiPheDuyetC1(approvedBy);
            entity.setNgayPheDuyetC1(LocalDateTime.now());
        }

        TramRadar saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(saved.getId())
                .capPheDuyet(1)
                .trangThai(request.getQuyetDinh())
                .nguoiPheDuyet(approvedBy)
                .lyDo(request.getLyDo())
                .build());

        return toResponse(saved);
    }

    public TramRadarResponse approveC2(Long id, PheDuyetRequest request, String approvedBy) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TramRadar not found: " + id));

        if (!"UNDER_REVIEW".equals(entity.getTrangThai())) {
            throw new RuntimeException("Can only approve UNDER_REVIEW records: " + id);
        }

        String c1Actor = entity.getNguoiPheDuyetC1();
        if (c1Actor != null && c1Actor.equals(approvedBy)) {
            throw new IllegalStateException("Nguoi phe duyet C2 khong duoc trung voi nguoi phe duyet C1");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setTrangThai("REJECTED");
            entity.setLyDoTuChoi(request.getLyDo());
        } else {
            entity.setTrangThai("APPROVED");
            entity.setPheDuyetC2(true);
            entity.setNguoiPheDuyetC2(approvedBy);
            entity.setNgayPheDuyetC2(LocalDateTime.now());
        }

        TramRadar saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(saved.getId())
                .capPheDuyet(2)
                .trangThai(request.getQuyetDinh())
                .nguoiPheDuyet(approvedBy)
                .lyDo(request.getLyDo())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(Long tramRadarId) {
        return historyRepository.findByTramRadarIdOrderByNgayPheDuyetDesc(tramRadarId)
                .stream().map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .capPheDuyet(h.getCapPheDuyet())
                        .trangThai(h.getTrangThai())
                        .nguoiPheDuyet(h.getNguoiPheDuyet())
                        .ngayPheDuyet(h.getNgayPheDuyet())
                        .lyDo(h.getLyDo())
                        .build()).toList();
    }

    public List<TramRadarResponse> search(String keyword, String tinhTrang, String trangThai) {
        return repository.search(keyword, tinhTrang, trangThai, org.springframework.data.domain.Pageable.unpaged()).stream()
                .map(this::toResponse)
                .toList();
    }

    private TramRadarResponse toResponse(TramRadar entity) {
        List<TramRadarAttachmentResponse> attachments = entity.getAttachments().stream()
                .map(a -> TramRadarAttachmentResponse.builder()
                        .id(a.getId())
                        .tenTaiLieu(a.getTenTaiLieu())
                        .duongDan(a.getDuongDan())
                        .kichThuoc(a.getKichThuoc())
                        .loaiTaiLieu(a.getLoaiTaiLieu())
                        .nguoiTaiLen(a.getNguoiTaiLen())
                        .ngayTaiLen(a.getNgayTaiLen())
                        .build()).toList();

        return TramRadarResponse.builder()
                .id(entity.getId())
                .tenTram(entity.getTenTram())
                .viTri(entity.getViTri())
                .kinhDo(entity.getKinhDo())
                .viDo(entity.getViDo())
                .loaiTram(entity.getLoaiTram())
                .coTrinh(entity.getCoTrinh())
                .dienTichPhaXa(entity.getDienTichPhaXa())
                .nguonGoc(entity.getNguonGoc())
                .tinhTrang(entity.getTinhTrang())
                .trangThai(entity.getTrangThai())
                .pheDuyetC1(entity.getPheDuyetC1())
                .nguoiPheDuyetC1(entity.getNguoiPheDuyetC1())
                .ngayPheDuyetC1(entity.getNgayPheDuyetC1())
                .pheDuyetC2(entity.getPheDuyetC2())
                .nguoiPheDuyetC2(entity.getNguoiPheDuyetC2())
                .ngayPheDuyetC2(entity.getNgayPheDuyetC2())
                .lyDoTuChoi(entity.getLyDoTuChoi())
                .nguoiTao(entity.getNguoiTao())
                .ngayTao(entity.getNgayTao())
                .nguoiSuaDoi(entity.getNguoiSuaDoi())
                .ngaySuaDoi(entity.getNgaySuaDoi())
                .attachments(attachments)
                .build();
    }
}
