package com.hanghai.kchtg.cosuachua.service;

import com.hanghai.kchtg.cosuachua.dto.*;
import com.hanghai.kchtg.cosuachua.entity.*;
import com.hanghai.kchtg.cosuachua.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CoSuaChuaDongTauService {

    private final CoSuaChuaDongTauRepository repository;
    private final CoSuaChuaDongTauAttachmentRepository attachmentRepository;
    private final PheDuyetLichSuRepository historyRepository;

    public CoSuaChuaDongTauResponse create(CoSuaChuaDongTauCreateRequest request, String createdBy) {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo(request.getTenCoSo())
                .diaChi(request.getDiaChi())
                .tinhThanh(request.getTinhThanh())
                .soDienThoai(request.getSoDienThoai())
                .email(request.getEmail())
                .loaiCoSo(request.getLoaiCoSo())
                .khaNang(request.getKhaNang())
                .chuQuan(request.getChuQuan())
                .trangThai("PROPOSED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao(createdBy)
                .build();

        CoSuaChuaDongTau saved = repository.save(entity);
        historyRepository.save(PheDuyetLichSu.builder()
                .coSuaChuaId(saved.getId())
                .capPheDuyet(0)
                .trangThai("CREATE")
                .nguoiPheDuyet(createdBy)
                .ngayPheDuyet(LocalDateTime.now())
                .lyDo("Tạo mới cơ sở sửa chữa, đóng tàu")
                .build());

        return toResponse(saved);
    }

    public CoSuaChuaDongTauResponse getById(Long id) {
        CoSuaChuaDongTau entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("CoSuaChuaDongTau not found: " + id));
        if (entity.getIsDeleted()) {
            throw new RuntimeException("CoSuaChuaDongTau is deleted: " + id);
        }
        return toResponse(entity);
    }

    public List<CoSuaChuaDongTauResponse> findAll(int page, int size) {
        return repository.findByTrangThaiAndIsDeletedFalse("APPROVED").stream().map(this::toResponse).toList();
    }

    public CoSuaChuaDongTauResponse update(Long id, CoSuaChuaDongTauUpdateRequest request, String updatedBy) {
        CoSuaChuaDongTau entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("CoSuaChuaDongTau not found: " + id));

        if (entity.getIsDeleted()) {
            throw new RuntimeException("Cannot update deleted record: " + id);
        }

        if ("APPROVED".equals(entity.getTrangThai())) {
            entity.setTrangThai("UNDER_REVIEW");
        }

        if (request.getTenCoSo() != null) entity.setTenCoSo(request.getTenCoSo());
        if (request.getDiaChi() != null) entity.setDiaChi(request.getDiaChi());
        if (request.getTinhThanh() != null) entity.setTinhThanh(request.getTinhThanh());
        if (request.getSoDienThoai() != null) entity.setSoDienThoai(request.getSoDienThoai());
        if (request.getEmail() != null) entity.setEmail(request.getEmail());
        if (request.getLoaiCoSo() != null) entity.setLoaiCoSo(request.getLoaiCoSo());
        if (request.getKhaNang() != null) entity.setKhaNang(request.getKhaNang());
        if (request.getChuQuan() != null) entity.setChuQuan(request.getChuQuan());

        CoSuaChuaDongTau saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .coSuaChuaId(saved.getId())
                .capPheDuyet(0)
                .trangThai("UPDATE")
                .nguoiPheDuyet(updatedBy)
                .ngayPheDuyet(LocalDateTime.now())
                .lyDo("Cập nhật cơ sở sửa chữa, đóng tàu")
                .build());

        return toResponse(saved);
    }

    public void delete(Long id, String deletedBy) {
        CoSuaChuaDongTau entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("CoSuaChuaDongTau not found: " + id));

        if (!"APPROVED".equals(entity.getTrangThai())) {
            throw new RuntimeException("Can only delete APPROVED records: " + id);
        }

        entity.setIsDeleted(true);
        repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .coSuaChuaId(entity.getId())
                .capPheDuyet(0)
                .trangThai("DELETE")
                .nguoiPheDuyet(deletedBy)
                .ngayPheDuyet(LocalDateTime.now())
                .lyDo("Xóa cơ sở sửa chữa, đóng tàu")
                .build());

        attachmentRepository.deleteByCoSuaChuaDongTauId(id);
    }

    public CoSuaChuaDongTauResponse approveC1(Long id, PheDuyetRequest request, String approvedBy) {
        CoSuaChuaDongTau entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("CoSuaChuaDongTau not found: " + id));

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

        CoSuaChuaDongTau saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .coSuaChuaId(saved.getId())
                .capPheDuyet(1)
                .trangThai(request.getQuyetDinh())
                .nguoiPheDuyet(approvedBy)
                .ngayPheDuyet(LocalDateTime.now())
                .lyDo(request.getLyDo())
                .build());

        return toResponse(saved);
    }

    public CoSuaChuaDongTauResponse approveC2(Long id, PheDuyetRequest request, String approvedBy) {
        CoSuaChuaDongTau entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("CoSuaChuaDongTau not found: " + id));

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

        CoSuaChuaDongTau saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .coSuaChuaId(saved.getId())
                .capPheDuyet(2)
                .trangThai(request.getQuyetDinh())
                .nguoiPheDuyet(approvedBy)
                .ngayPheDuyet(LocalDateTime.now())
                .lyDo(request.getLyDo())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(Long coSuaChuaId) {
        return historyRepository.findByCoSuaChuaIdOrderByNgayPheDuyetDesc(coSuaChuaId)
                .stream().map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .capPheDuyet(h.getCapPheDuyet())
                        .trangThai(h.getTrangThai())
                        .nguoiPheDuyet(h.getNguoiPheDuyet())
                        .ngayPheDuyet(h.getNgayPheDuyet())
                        .lyDo(h.getLyDo())
                        .build()).toList();
    }

    public List<CoSuaChuaDongTauResponse> search(String keyword, String tinhThanh, String trangThai) {
        return repository.search(keyword, tinhThanh, trangThai).stream().map(this::toResponse).toList();
    }

    private CoSuaChuaDongTauResponse toResponse(CoSuaChuaDongTau entity) {
        List<CoSuaChuaDongTauAttachmentResponse> attachments = attachmentRepository
                .findByCoSuaChuaDongTauId(entity.getId())
                .stream().map(a -> CoSuaChuaDongTauAttachmentResponse.builder()
                        .id(a.getId())
                        .tenTaiLieu(a.getTenTaiLieu())
                        .duongDan(a.getDuongDan())
                        .kichThuoc(a.getKichThuoc())
                        .loaiTaiLieu(a.getLoaiTaiLieu())
                        .nguoiTaiLen(a.getNguoiTaiLen())
                        .ngayTaiLen(a.getNgayTaiLen())
                        .build()).toList();

        return CoSuaChuaDongTauResponse.builder()
                .id(entity.getId())
                .tenCoSo(entity.getTenCoSo())
                .diaChi(entity.getDiaChi())
                .tinhThanh(entity.getTinhThanh())
                .soDienThoai(entity.getSoDienThoai())
                .email(entity.getEmail())
                .loaiCoSo(entity.getLoaiCoSo())
                .khaNang(entity.getKhaNang())
                .chuQuan(entity.getChuQuan())
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
                .isDeleted(entity.getIsDeleted())
                .attachments(attachments)
                .build();
    }
}
