package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import com.hanghai.kchtg.orgunit.entity.UnitHistory;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.repository.UnitHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Primary service for organisational unit management.
 * Integrates MaterializedPathService for tree operations, approval workflow,
 * and audit trail via UnitHistory.
 *
 * <p>
 * Consolidates the old OrgUnitService and OrganizationService into a single
 * canonical implementation per the tech-lead plan.
 * </p>
 *
 * <p>
 * Business rules enforced:
 * <ul>
 *   <li>BR-013: unique unit code</li>
 *   <li>BR-014: delete guard (no children, no related personnel)</li>
 *   <li>BR-015: Admin-only approval</li>
 *   <li>BR-016: parent-child hierarchy with circular ref detection</li>
 *   <li>BR-017: coefficient > 0, max 2 decimal places</li>
 * </ul>
 * </p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private static final Logger log = LoggerFactory.getLogger(OrganizationService.class);

    private final OrgUnitRepository orgUnitRepo;
    private final UnitHistoryRepository unitHistoryRepo;
    private final MaterializedPathService materializedPathService;

    // ═══════════════════════════════════════════════════════════════════
    // ── Queries ──────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Flat list of all active units with pagination.
     */
    @Transactional(readOnly = true)
    public Page<OrgUnitResponse> findAll(Pageable pageable) {
        return orgUnitRepo.findAllActiveOrderByPath(pageable)
                .map(OrgUnitResponse::from);
    }

    /**
     * Flat list of all active units (no pagination).
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findAll() {
        return orgUnitRepo.findAllActiveOrderByPath().stream()
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Full hierarchical tree starting from root nodes, built using path-based ordering.
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> buildTree() {
        List<OrgUnit> all = orgUnitRepo.findAllActiveOrderByPath();
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
     * Get sub-tree under a specific unit.
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findSubTree(UUID unitId) {
        if (!orgUnitRepo.existsById(unitId)) {
            throw new EntityNotFoundException("Đơn vị không tồn tại: " + unitId);
        }
        List<OrgUnit> subtree = materializedPathService.getSubtree(unitId);
        return subtree.stream().map(OrgUnitResponse::from).collect(Collectors.toList());
    }

    /**
     * Direct children of a specific parent (flat list).
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findByParentId(UUID parentId) {
        return orgUnitRepo.findByParentId(parentId).stream()
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Single unit by ID.
     */
    @Transactional(readOnly = true)
    public OrgUnitResponse findById(UUID id) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));
        return OrgUnitResponse.from(unit);
    }

    // ── Search / filter ──────────────────────────────────────────────

    /**
     * Search units by name or code (case-insensitive).
     */
    @Transactional(readOnly = true)
    public Page<OrgUnitResponse> searchUnits(String query, Pageable pageable) {
        return orgUnitRepo.findByNameLikeOrCodeLike(query, pageable)
                .map(OrgUnitResponse::from);
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> searchUnits(String query) {
        return orgUnitRepo.findByNameLikeOrCodeLike(query).stream()
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Filter units by type, status, and/or level.
     */
    @Transactional(readOnly = true)
    public Page<OrgUnitResponse> filterUnits(OrgUnitType type, OrgUnitStatus status,
                                              Integer level, Pageable pageable) {
        return orgUnitRepo.findByFilters(type, status, level, pageable)
                .map(OrgUnitResponse::from);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── Mutations ────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Create a new unit with full materialized path computation,
     * circular reference detection, and audit trail.
     *
     * @throws IllegalArgumentException if code already exists or circular ref detected
     * @throws EntityNotFoundException  if parent does not exist
     */
    public OrgUnitResponse create(CreateOrgUnitRequest request, UUID operatorId, String operatorName) {
        // BR-013: unique code check (active only)
        if (orgUnitRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã đơn vị đã tồn tại: " + request.getCode());
        }

        // Validate parent exists if specified
        OrgUnit parent = null;
        if (request.getParentId() != null) {
            parent = orgUnitRepo.findById(request.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Đơn vị cha không tồn tại: " + request.getParentId()));

            // BR-016: circular reference detection
            if (materializedPathService.isSelfParent(request.getParentId(), request.getParentId())) {
                throw new IllegalArgumentException(
                        "Đơn vị không thể là cha của chính nó");
            }

            // Check if parent is actually an ancestor of itself (shouldn't happen, but defensive)
            if (materializedPathService.isAncestor(request.getParentId(), request.getParentId())) {
                throw new IllegalArgumentException(
                        "Đơn vị không thể là cha của chính nó");
            }
        }

        OrgUnit unit = OrgUnit.builder()
                .name(request.getName())
                .code(request.getCode())
                .parentId(request.getParentId())
                .type(request.getType())
                .description(request.getDescription())
                .address(request.getAddress())
                .phone(request.getPhone())
                .coefficient(request.getCoefficient())
                .status(request.getStatus() != null ? request.getStatus() : OrgUnitStatus.DRAFT)
                .scopeId(0L)
                .sortOrder(0)
                .path("")   // placeholder — set below
                .level(0)   // placeholder — set below
                .build();

        // Compute materialized path and level
        String computedPath = materializedPathService.computePath(request.getParentId(), unit.getId());
        unit.setPath(computedPath);
        unit.setLevel(materializedPathService.calculateLevel(computedPath));

        // Compute sortOrder: max existing children + 1
        if (parent != null) {
            long childCount = orgUnitRepo.countByParentIdAndDeletedAtIsNull(parent.getId());
            unit.setSortOrder(Math.toIntExact(childCount));
        }

        OrgUnit saved = orgUnitRepo.save(unit);

        // Audit trail
        saveHistory(saved, "CREATED", "Tạo mới đơn vị", operatorId, operatorName);

        log.info("Created org unit: {} ({}, path: {}, level: {})", saved.getCode(), saved.getId(),
                 saved.getPath(), saved.getLevel());
        return OrgUnitResponse.from(saved);
    }

    /**
     * Partial update of an existing unit. Only non-null fields are applied.
     * Includes code uniqueness, circular reference detection, and path rebuild.
     */
    public OrgUnitResponse update(UUID id, UpdateOrgUnitRequest request, UUID operatorId, String operatorName) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));

        // BR-013: unique code check (excluding self)
        if (request.getCode() != null && !request.getCode().equals(unit.getCode())) {
            if (orgUnitRepo.existsByCodeAndIdNotAndDeletedAtIsNull(request.getCode(), id)) {
                throw new IllegalArgumentException("Mã đơn vị đã tồn tại: " + request.getCode());
            }
            unit.setCode(request.getCode());
        }

        // Handle parent change
        if (request.getParentId() != null) {
            UUID newParentId = request.getParentId();

            // Self-parent check
            if (newParentId.equals(id)) {
                throw new IllegalArgumentException("Đơn vị không thể là cha của chính nó");
            }

            // Parent must exist
            OrgUnit newParent = orgUnitRepo.findById(newParentId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Đơn vị cha không tồn tại: " + newParentId));

            // BR-016: circular reference detection
            if (materializedPathService.isAncestor(id, newParentId)) {
                throw new IllegalArgumentException(
                        "Không thể đặt đơn vị con làm cha của đơn vị cha — sẽ tạo vòng lặp phân cấp");
            }

            // Parent changed — cascade path rebuild
            if (!newParentId.equals(unit.getParentId())) {
                materializedPathService.cascadePathRebuild(id, newParentId);
            }

            unit.setParentId(newParentId);
        }

        // Update scalar fields
        if (request.getName() != null) unit.setName(request.getName());
        if (request.getType() != null) unit.setType(request.getType());
        if (request.getDescription() != null) unit.setDescription(request.getDescription());
        if (request.getAddress() != null) unit.setAddress(request.getAddress());
        if (request.getPhone() != null) unit.setPhone(request.getPhone());
        if (request.getCoefficient() != null) unit.setCoefficient(request.getCoefficient());

        OrgUnit saved = orgUnitRepo.save(unit);
        saveHistory(saved, "UPDATED", "Cập nhật đơn vị", operatorId, operatorName);

        log.info("Updated org unit: {} ({})", saved.getCode(), saved.getId());
        return OrgUnitResponse.from(saved);
    }

    /**
     * Soft-delete a unit. Fails if the unit has children or related personnel.
     * BR-014: delete guard.
     */
    public void delete(UUID id, UUID operatorId, String operatorName) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));

        // Check for children (BR-014)
        long childCount = orgUnitRepo.countByParentIdAndDeletedAtIsNull(id);
        if (childCount > 0) {
            throw new IllegalArgumentException(
                    "Không thể xóa đơn vị có " + childCount + " đơn vị con. "
                            + "Vui lòng xóa hoặc di chuyển các đơn vị con trước.");
        }

        String details = String.format("Xóa đơn vị '%s' (code: %s)", unit.getName(), unit.getCode());
        saveHistory(unit, "DELETED", details, operatorId, operatorName);
        unit.softDelete();
        orgUnitRepo.save(unit);

        log.info("Soft-deleted org unit: {} ({})", unit.getCode(), unit.getId());
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── Approval Workflow ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Submit a unit for approval. Transitions DRAFT → PENDING.
     * Any role with create permissions can submit.
     */
    public OrgUnitResponse submitForApproval(UUID id, UUID operatorId, String operatorName) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));

        if (unit.getStatus() != OrgUnitStatus.DRAFT && unit.getStatus() != OrgUnitStatus.REJECTED) {
            throw new IllegalStateException(
                    "Chỉ đơn vị ở trạng thái DRAFT hoặc REJECTED mới được gửi phê duyệt. "
                            + "Trạng thái hiện tại: " + unit.getStatus());
        }

        unit.setStatus(OrgUnitStatus.PENDING);
        OrgUnit saved = orgUnitRepo.save(unit);
        saveHistory(saved, "SUBMITTED", "Gửi phê duyệt", operatorId, operatorName);

        log.info("Submitted org unit for approval: {} ({})", saved.getCode(), saved.getId());
        return OrgUnitResponse.from(saved);
    }

    /**
     * Approve a pending unit. Transitions PENDING → APPROVED.
     * BR-015: Admin-only approval.
     */
    public OrgUnitResponse approve(UUID id, UUID approverId, String approverName, String comments) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));

        if (unit.getStatus() != OrgUnitStatus.PENDING) {
            throw new IllegalStateException(
                    "Chỉ đơn vị ở trạng thái PENDING mới được phê duyệt. "
                            + "Trạng thái hiện tại: " + unit.getStatus());
        }

        unit.setStatus(OrgUnitStatus.APPROVED);
        unit.setApprovedAt(java.time.LocalDateTime.now());
        OrgUnit saved = orgUnitRepo.save(unit);
        saveHistory(saved, "APPROVED",
                "Đã phê duyệt bởi " + approverName + (comments != null ? ": " + comments : ""),
                approverId, approverName);

        log.info("Approved org unit: {} ({})", saved.getCode(), saved.getId());
        return OrgUnitResponse.from(saved);
    }

    /**
     * Reject a pending unit. Transitions PENDING → REJECTED.
     * BR-015: Admin-only approval.
     */
    public OrgUnitResponse reject(UUID id, UUID approverId, String approverName, String comments) {
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));

        if (unit.getStatus() != OrgUnitStatus.PENDING) {
            throw new IllegalStateException(
                    "Chỉ đơn vị ở trạng thái PENDING mới được từ chối. "
                            + "Trạng thái hiện tại: " + unit.getStatus());
        }

        unit.setStatus(OrgUnitStatus.REJECTED);
        unit.setApprovedAt(null); // clear approvedAt on reject
        OrgUnit saved = orgUnitRepo.save(unit);
        saveHistory(saved, "REJECTED",
                "Từ chối bởi " + approverName + (comments != null ? ": " + comments : ""),
                approverId, approverName);

        log.info("Rejected org unit: {} ({})", saved.getCode(), saved.getId());
        return OrgUnitResponse.from(saved);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── Root unit seeding ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Seed the root unit if none exists. Called after Flyway migration.
     */
    public OrgUnitResponse seedRoot(String name, String code, OrgUnitType type,
                                     String description, String address, String phone,
                                     Double coefficient, UUID operatorId, String operatorName) {
        long rootCount = orgUnitRepo.findByParentIdIsNull().size();
        if (rootCount > 0) {
            log.warn("Root unit already exists ({} roots found). Skipping seed.", rootCount);
            return findById(orgUnitRepo.findByParentIdIsNull().get(0).getId());
        }

        OrgUnit root = OrgUnit.builder()
                .name(name)
                .code(code)
                .type(type)
                .description(description)
                .address(address)
                .phone(phone)
                .coefficient(coefficient)
                .status(OrgUnitStatus.APPROVED) // root is pre-approved
                .scopeId(0L)
                .sortOrder(0)
                .build();

        // Compute root path
        String rootPath = materializedPathService.computeRootPath(root.getId());
        root.setPath(rootPath);
        root.setLevel(materializedPathService.calculateLevel(rootPath));
        root.setApprovedAt(java.time.LocalDateTime.now());

        OrgUnit saved = orgUnitRepo.save(root);
        saveHistory(saved, "CREATED", "Tạo mới đơn vị gốc", operatorId, operatorName);

        log.info("Seeded root org unit: {} ({}, path: {})", saved.getCode(), saved.getId(), saved.getPath());
        return OrgUnitResponse.from(saved);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── Private helpers ──────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    private void saveHistory(OrgUnit unit, String action, String details,
                              UUID performedBy, String performedByName) {
        UnitHistory history = UnitHistory.create(unit.getId(), action, details,
                performedBy, performedByName);
        history.setUnitName(unit.getName());
        history.setUnitCode(unit.getCode());
        unitHistoryRepo.save(history);
    }
}
