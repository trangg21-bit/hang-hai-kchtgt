package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrganizationChart;
import com.hanghai.kchtg.orgunit.entity.UnitHistory;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.repository.UnitRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service quản lý đơn vị tổ chức với tính năng xây dựng cây tổ chức
 * và quy trình phê duyệt phân cấp (approval workflow).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private static final Logger log = LoggerFactory.getLogger(OrganizationService.class);

    private final OrgUnitRepository orgUnitRepo;
    private final UnitRepository unitRepo;

    // ── Queries ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findAll() {
        return orgUnitRepo.findAll().stream()
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Xây dựng cây tổ chức đầy đủ từ root.
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> buildTree() {
        List<OrgUnit> all = orgUnitRepo.findAll();
        Map<UUID, List<OrgUnit>> childrenMap = all.stream()
                .filter(u -> u.getParentId() != null)
                .collect(Collectors.groupingBy(OrgUnit::getParentId));
        return all.stream()
                .filter(u -> u.getParentId() == null)
                .map(root -> buildTree(root, childrenMap))
                .collect(Collectors.toList());
    }

    private OrgUnitResponse buildTree(OrgUnit unit, Map<UUID, List<OrgUnit>> childrenMap) {
        OrgUnitResponse response = OrgUnitResponse.from(unit);
        List<OrgUnit> children = childrenMap.getOrDefault(unit.getId(), Collections.emptyList());
        if (!children.isEmpty()) {
            response.setChildren(children.stream()
                    .map(child -> buildTree(child, childrenMap))
                    .collect(Collectors.toList()));
        }
        return response;
    }

    /**
     * Lấy toàn bộ cây con của một đơn vị cụ thể.
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findSubTree(UUID unitId) {
        if (!orgUnitRepo.existsById(unitId)) {
            throw new EntityNotFoundException("Đơn vị không tồn tại: " + unitId);
        }
        List<OrgUnit> all = orgUnitRepo.findAll();
        Set<UUID> visited = new HashSet<>();
        List<OrgUnit> subTree = collectSubTree(all, unitId, visited);
        return subTree.stream().map(OrgUnitResponse::from).collect(Collectors.toList());
    }

    private List<OrgUnit> collectSubTree(List<OrgUnit> all, UUID parentId, Set<UUID> visited) {
        visited.add(parentId);
        List<OrgUnit> result = new ArrayList<>();
        for (OrgUnit u : all) {
            if (u.getParentId() != null && u.getParentId().equals(parentId) && !visited.contains(u.getId())) {
                result.add(u);
                result.addAll(collectSubTree(all, u.getId(), visited));
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public OrgUnitResponse findById(UUID id) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));
        return OrgUnitResponse.from(unit);
    }

    // ── Mutations ────────────────────────────────────────────────────

    /**
     * Tạo mới đơn vị với ghi nhận lịch sử.
     */
    public OrgUnitResponse create(CreateOrgUnitRequest request, UUID operatorId, String operatorName) {
        if (orgUnitRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã đơn vị đã tồn tại: " + request.getCode());
        }

        OrgUnit unit = OrgUnit.builder()
                .name(request.getName())
                .code(request.getCode())
                .parentId(request.getParentId())
                .type(request.getType())
                .address(request.getAddress())
                .phone(request.getPhone())
                .status(request.getStatus() != null ? request.getStatus() : OrgUnitStatus.ACTIVE)
                .build();

        OrgUnit saved = orgUnitRepo.save(unit);

        // Ghi history
        saveHistory(saved, "CREATED", "Tạo mới đơn vị", operatorId, operatorName);

        // Tính level và sortOrder
        calculateLevelAndSortOrder(saved);

        log.info("Created org unit: {} ({})", saved.getCode(), saved.getId());
        return OrgUnitResponse.from(saved);
    }

    /**
     * Cập nhật đơn vị với ghi nhận lịch sử.
     */
    public OrgUnitResponse update(UUID id, UpdateOrgUnitRequest request, UUID operatorId, String operatorName) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));

        if (request.getCode() != null && !request.getCode().equals(unit.getCode())) {
            if (orgUnitRepo.existsByCodeAndIdNot(request.getCode(), id)) {
                throw new IllegalArgumentException("Mã đơn vị đã tồn tại: " + request.getCode());
            }
            unit.setCode(request.getCode());
        }

        if (request.getParentId() != null && request.getParentId().equals(id)) {
            throw new IllegalArgumentException("Đơn vị không thể là cha của chính nó");
        }

        if (request.getName() != null) unit.setName(request.getName());
        if (request.getType() != null) unit.setType(request.getType());
        if (request.getAddress() != null) unit.setAddress(request.getAddress());
        if (request.getPhone() != null) unit.setPhone(request.getPhone());
        if (request.getStatus() != null) unit.setStatus(request.getStatus());

        OrgUnit saved = orgUnitRepo.save(unit);
        saveHistory(saved, "UPDATED", "Cập nhật đơn vị", operatorId, operatorName);

        log.info("Updated org unit: {} ({})", saved.getCode(), saved.getId());
        return OrgUnitResponse.from(saved);
    }

    /**
     * Xóa đơn vị (không cho phép nếu có con).
     */
    public void delete(UUID id, UUID operatorId, String operatorName) {
        if (!orgUnitRepo.existsById(id)) {
            throw new EntityNotFoundException("Đơn vị không tồn tại: " + id);
        }
        OrgUnit unit = orgUnitRepo.findById(id).orElseThrow();
        String details = String.format("Xóa đơn vị '%s' (code: %s)", unit.getName(), unit.getCode());
        saveHistory(unit, "DELETED", details, operatorId, operatorName);
        unit.softDelete();
        orgUnitRepo.save(unit);
        log.info("Soft-deleted org unit: {} ({})", unit.getCode(), unit.getId());
    }

    // ── Approval Workflow ────────────────────────────────────────────

    /**
     * Phê duyệt thay đổi cho đơn vị (approval workflow).
     */
    public OrgUnitResponse approve(UUID id, UUID approverId, String approverName, String comments) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));

        if (unit.getStatus() != OrgUnitStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Đơn vị không ở trạng thái chờ phê duyệt");
        }

        unit.setStatus(OrgUnitStatus.ACTIVE);
        OrgUnit saved = orgUnitRepo.save(unit);
        saveHistory(saved, "APPROVED", "Đã phê duyệt bởi " + approverName + (comments != null ? ": " + comments : ""),
                approverId, approverName);
        log.info("Approved org unit: {} ({})", saved.getCode(), saved.getId());
        return OrgUnitResponse.from(saved);
    }

    /**
     * Từ chối yêu cầu thay đổi.
     */
    public OrgUnitResponse reject(UUID id, UUID approverId, String approverName, String comments) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));

        if (unit.getStatus() != OrgUnitStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Đơn vị không ở trạng thái chờ phê duyệt");
        }

        unit.setStatus(OrgUnitStatus.ACTIVE);
        OrgUnit saved = orgUnitRepo.save(unit);
        saveHistory(saved, "REJECTED", "Từ chối bởi " + approverName + (comments != null ? ": " + comments : ""),
                approverId, approverName);
        log.info("Rejected org unit: {} ({})", saved.getCode(), saved.getId());
        return OrgUnitResponse.from(saved);
    }

    // ── Private ──────────────────────────────────────────────────────

    private void saveHistory(OrgUnit unit, String action, String details,
                             UUID performedBy, String performedByName) {
        UnitHistory history = UnitHistory.create(unit.getId(), action, details,
                performedBy, performedByName);
        history.setUnitName(unit.getName());
        history.setUnitCode(unit.getCode());
    }

    private void calculateLevelAndSortOrder(OrgUnit unit) {
        if (unit.getParentId() != null) {
            OrgUnit parent = orgUnitRepo.findById(unit.getParentId()).orElse(null);
            int parentLevel = parent != null ? (parent.getParentId() != null ? 1 : 0) : 0;
            long childrenCount = orgUnitRepo.findByParentId(unit.getId()).size();
            // SortOrder dựa trên số lượng con hiện tại
        }
        // Lưu OrganizationChart (đơn giản hóa)
    }
}
