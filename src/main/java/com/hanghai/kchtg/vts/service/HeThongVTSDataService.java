package com.hanghai.kchtg.vts.service;

import com.hanghai.kchtg.vts.dto.*;
import com.hanghai.kchtg.vts.entity.*;
import com.hanghai.kchtg.vts.repository.PheDuyetLichSuRepository;
import com.hanghai.kchtg.vts.repository.HeThongVTSRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class HeThongVTSDataService {

    private final HeThongVTSRepository repository;
    private final PheDuyetLichSuRepository historyRepository;

    public HeThongVTSDataService(HeThongVTSRepository repository,
                                PheDuyetLichSuRepository historyRepository) {
        this.repository = repository;
        this.historyRepository = historyRepository;
    }

    public HeThongVTSResponse create(HeThongVTSCreateRequest request, String username) {
        HeThongVTS entity = HeThongVTS.builder()
                .tenHeThong(request.getTenHeThong())
                .viTri(request.getViTri())
                .tinhTrang(request.getTinhTrang())
                .mucDoPhuTrach(request.getMucDoPhuTrach())
                .nguonGoc(request.getNguonGoc())
                .doiTac(request.getDoiTac())
                .orgUnitId(request.getOrgUnitId())
                .trangThai(HeThongVTSApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao(username)
                .build();

        HeThongVTS saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .heThongVTSId(saved.getId())
                .capPheDuyet(0)
                .trangThai("CREATED")
                .nguoiPheDuyet(username)
                .lyDo("Tạo mới hệ thống VTS")
                .build());

        return toResponse(saved);
    }

    public HeThongVTSResponse getById(Long id) {
        HeThongVTS entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));
        return toResponse(entity);
    }

    public Page<HeThongVTSResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<HeThongVTSResponse> findAllWithSearch(UUID orgUnitId, String keyword, String tinhTrang, String trangThai, int page, int size) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        String trimmedTinhTrang = (tinhTrang != null && !tinhTrang.trim().isEmpty()) ? tinhTrang.trim() : null;
        String trimmedTrangThai = (trangThai != null && !trangThai.trim().isEmpty()) ? trangThai.trim() : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao"));
        HeThongVTSApprovalStatus statusEnum = (trimmedTrangThai != null) ? HeThongVTSApprovalStatus.fromString(trimmedTrangThai) : null;
        com.hanghai.kchtg.vts.entity.TinhTrangVTS tinhTrangEnum = (trimmedTinhTrang != null) ? com.hanghai.kchtg.vts.entity.TinhTrangVTS.fromString(trimmedTinhTrang) : null;
        return repository.search(orgUnitId, keywordLike, tinhTrangEnum, statusEnum, pageable).map(this::toResponse);
    }

    public HeThongVTSResponse update(Long id, HeThongVTSUpdateRequest request, String username) {
        HeThongVTS entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        boolean wasApproved = entity.getTrangThai() == HeThongVTSApprovalStatus.APPROVED;

        if (request.getTenHeThong() != null) entity.setTenHeThong(request.getTenHeThong());
        if (request.getViTri() != null) entity.setViTri(request.getViTri());
        if (request.getTinhTrang() != null) entity.setTinhTrang(request.getTinhTrang());
        if (request.getMucDoPhuTrach() != null) entity.setMucDoPhuTrach(request.getMucDoPhuTrach());
        if (request.getNguonGoc() != null) entity.setNguonGoc(request.getNguonGoc());
        if (request.getDoiTac() != null) entity.setDoiTac(request.getDoiTac());
        if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());

        entity.setNguoiSuaDoi(username);

        if (wasApproved) {
            entity.setTrangThai(HeThongVTSApprovalStatus.UNDER_REVIEW);
        }

        HeThongVTS saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .heThongVTSId(saved.getId())
                .capPheDuyet(0)
                .trangThai("UPDATED")
                .nguoiPheDuyet(username)
                .lyDo("Cập nhật thông tin")
                .build());

        return toResponse(saved);
    }

    public void delete(Long id, String username) {
        HeThongVTS entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (entity.getTrangThai() != HeThongVTSApprovalStatus.APPROVED) {
            throw new RuntimeException("Chỉ có thể xóa bản ghi đã được phê duyệt (APPROVED)");
        }

        entity.setIsDeleted(true);
        entity.setNguoiSuaDoi(username);
        repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .heThongVTSId(entity.getId())
                .capPheDuyet(0)
                .trangThai("DELETED")
                .nguoiPheDuyet(username)
                .lyDo("Xóa bản ghi")
                .build());
    }

    public HeThongVTSResponse approveC1(Long id, PheDuyetRequest request, String username) {
        HeThongVTS entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (entity.getTrangThai() != HeThongVTSApprovalStatus.PROPOSED) {
            throw new RuntimeException("Chỉ có thể phê duyệt từ trạng thái Chờ duyệt (PROPOSED)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setTrangThai(HeThongVTSApprovalStatus.REJECTED);
            entity.setLyDoTuChoi(request.getLyDo());
        } else {
            entity.setTrangThai(HeThongVTSApprovalStatus.UNDER_REVIEW);
        }

        entity.setPheDuyetC1(true);
        entity.setNguoiPheDuyetC1(username);
        entity.setNgayPheDuyetC1(LocalDateTime.now());

        HeThongVTS saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .heThongVTSId(saved.getId())
                .capPheDuyet(1)
                .trangThai(request.getQuyetDinh())
                .nguoiPheDuyet(username)
                .lyDo(request.getLyDo())
                .build());

        return toResponse(saved);
    }

    public HeThongVTSResponse approveC2(Long id, PheDuyetRequest request, String username) {
        HeThongVTS entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (entity.getTrangThai() != HeThongVTSApprovalStatus.UNDER_REVIEW) {
            throw new RuntimeException("Chỉ có thể phê duyệt từ trạng thái Đang xem xét (UNDER_REVIEW)");
        }

        String c1Actor = entity.getNguoiPheDuyetC1();
        if (c1Actor != null && c1Actor.equals(username) && !"admin".equals(username)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setTrangThai(HeThongVTSApprovalStatus.REJECTED);
            entity.setLyDoTuChoi(request.getLyDo());
        } else {
            entity.setTrangThai(HeThongVTSApprovalStatus.APPROVED);
        }

        entity.setPheDuyetC2(true);
        entity.setNguoiPheDuyetC2(username);
        entity.setNgayPheDuyetC2(LocalDateTime.now());

        HeThongVTS saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .heThongVTSId(saved.getId())
                .capPheDuyet(2)
                .trangThai(request.getQuyetDinh())
                .nguoiPheDuyet(username)
                .lyDo(request.getLyDo())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(Long id) {
        repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));
        return historyRepository.findByHeThongVTSIdOrderByNgayPheDuyetDesc(id).stream()
                .map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .capPheDuyet(h.getCapPheDuyet())
                        .trangThai(h.getTrangThai())
                        .nguoiPheDuyet(h.getNguoiPheDuyet())
                        .ngayPheDuyet(h.getNgayPheDuyet())
                        .lyDo(h.getLyDo())
                        .build())
                .collect(Collectors.toList());
    }

    public List<HeThongVTSResponse> search(UUID orgUnitId, String keyword, String tinhTrang, String trangThai) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        String trimmedTinhTrang = (tinhTrang != null && !tinhTrang.trim().isEmpty()) ? tinhTrang.trim() : null;
        String trimmedTrangThai = (trangThai != null && !trangThai.trim().isEmpty()) ? trangThai.trim() : null;
        Pageable pageable = PageRequest.of(0, 100);
        HeThongVTSApprovalStatus statusEnum = (trimmedTrangThai != null) ? HeThongVTSApprovalStatus.fromString(trimmedTrangThai) : null;
        com.hanghai.kchtg.vts.entity.TinhTrangVTS tinhTrangEnum = (trimmedTinhTrang != null) ? com.hanghai.kchtg.vts.entity.TinhTrangVTS.fromString(trimmedTinhTrang) : null;
        Page<HeThongVTS> pageResult = repository.search(orgUnitId, keywordLike, tinhTrangEnum, statusEnum, pageable);
        return pageResult.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private HeThongVTSResponse toResponse(HeThongVTS entity) {
        List<HeThongVTSAttachmentResponse> attachments = entity.getAttachments().stream()
                .map(a -> HeThongVTSAttachmentResponse.builder()
                        .id(a.getId())
                        .tenTaiLieu(a.getTenTaiLieu())
                        .duongDan(a.getDuongDan())
                        .kichThuoc(a.getKichThuoc())
                        .loaiTaiLieu(a.getLoaiTaiLieu())
                        .nguoiTaiLen(a.getNguoiTaiLen())
                        .ngayTaiLen(a.getNgayTaiLen())
                        .build())
                .collect(Collectors.toList());

        return HeThongVTSResponse.builder()
                .id(entity.getId())
                .tenHeThong(entity.getTenHeThong())
                .viTri(entity.getViTri())
                .tinhTrang(entity.getTinhTrang())
                .mucDoPhuTrach(entity.getMucDoPhuTrach())
                .nguonGoc(entity.getNguonGoc())
                .doiTac(entity.getDoiTac())
                .orgUnitId(entity.getOrgUnitId())
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
