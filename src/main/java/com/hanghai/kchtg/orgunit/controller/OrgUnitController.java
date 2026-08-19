package com.hanghai.kchtg.orgunit.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.service.OrganizationService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for organisational unit management (F-003).
 *
 * <p>
 * Base path: /api/org-units
 * Endpoints: CRUD, tree traversal, search/filter.
 * RBAC per role matrix from SA design.
 * </p>
 */
@RestController
@RequestMapping("/api/org-units")
@RequiredArgsConstructor
public class OrgUnitController {

    private final OrganizationService organizationService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final UserRepository userRepository;
    private final jakarta.persistence.EntityManager entityManager;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    private Operator getOperator() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = "system";
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            Object principal = auth.getPrincipal();
            if (principal instanceof org.springframework.security.core.userdetails.UserDetails ud) {
                username = ud.getUsername();
            } else if (principal instanceof String s) {
                username = s;
            } else {
                username = auth.getName();
            }
        }
        return new Operator(UUID.fromString("00000000-0000-0000-0000-000000000000"), username);
    }

    private record Operator(UUID id, String name) {}

    // ── Read endpoints (all authenticated users) ─────────────────────

    /**
     * Paginated list of all active units.
     *
     * <p>
     * Query params: page (default 0), size (default 20, max 100),
     * sortBy (name|code|type|level), sortDir (asc|desc)
     * </p>
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<OrgUnitResponse>>> list(
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortDir,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = (sortBy != null && !sortBy.isBlank()) ? sortBy : "path";

        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, sortField));
        Page<OrgUnitResponse> result = organizationService.findAll(pageable, orgUnitScopeService.currentUserScope());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Full active-unit options list for selectors and directory lookups.
     * The service resolves this list from the long-lived backend cache.
     */
    @GetMapping("/options")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<OrgUnitResponse>>> getOptions() {
        return ResponseEntity.ok(ApiResponse.success(
                organizationService.findAll(orgUnitScopeService.currentUserScope())));
    }

    /**
     * Full hierarchical tree (root → children recursively).
     */
    @GetMapping("/tree")
    @PreAuthorize("@auth.check(authentication, 'orgunit:read')")
    public ResponseEntity<ApiResponse<List<OrgUnitResponse>>> getTree() {
        return ResponseEntity.ok(ApiResponse.success(
                organizationService.buildTree(orgUnitScopeService.currentUserScope())));
    }

    /**
     * Sub-tree under a specific unit.
     */
    @GetMapping("/{id}/subtree")
    @PreAuthorize("@auth.check(authentication, 'orgunit:read')")
    public ResponseEntity<ApiResponse<List<OrgUnitResponse>>> getSubTree(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                organizationService.findSubTree(id, orgUnitScopeService.currentUserScope())));
    }

    /**
     * Direct children of a specific parent (flat list).
     */
    @GetMapping(params = "parentId")
    @PreAuthorize("@auth.check(authentication, 'orgunit:read')")
    public ResponseEntity<ApiResponse<List<OrgUnitResponse>>> getByParent(
            @RequestParam UUID parentId) {
        return ResponseEntity.ok(ApiResponse.success(
                organizationService.findByParentId(parentId, orgUnitScopeService.currentUserScope())));
    }

    /**
     * Single unit by ID (flat, no children).
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'orgunit:read')")
    public ResponseEntity<ApiResponse<OrgUnitResponse>> getById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                organizationService.findById(id, orgUnitScopeService.currentUserScope())));
    }

    // ── Search / filter endpoints ────────────────────────────────────

    /**
     * Search units by name or code (case-insensitive).
     */
    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'orgunit:read')")
    public ResponseEntity<ApiResponse<List<OrgUnitResponse>>> search(
            @RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.success(
                organizationService.searchUnits(q, orgUnitScopeService.currentUserScope())));
    }

    /**
     * Paginated search with filter by level.
     */
    @GetMapping("/filter")
    @PreAuthorize("@auth.check(authentication, 'orgunit:read')")
    public ResponseEntity<ApiResponse<Page<OrgUnitResponse>>> filter(
            @RequestParam(required = false) Integer level,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<OrgUnitResponse> result = organizationService.filterUnits(
                level, pageable, orgUnitScopeService.currentUserScope());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Write endpoints (Admin only) ─────────────────────────────────

    /**
     * Create a new organisational unit.
     */
    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'orgunit:manage')")
    public ResponseEntity<ApiResponse<OrgUnitResponse>> create(
            @Valid @RequestBody CreateOrgUnitRequest request) {
        User currentUser = getCurrentUser();
        Operator op = getOperator();
        OrgUnitResponse response = organizationService.create(
                request, op.id(), op.name(), orgUnitScopeService.currentUserScope());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đơn vị thành công", response));
    }

    /**
     * Partial update of an existing unit.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'orgunit:manage')")
    public ResponseEntity<ApiResponse<OrgUnitResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrgUnitRequest request) {
        Operator op = getOperator();
        entityManager.clear(); // flush auth-loaded User from persistence context
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật đơn vị thành công",
                organizationService.update(id, request, op.id(), op.name(),
                        orgUnitScopeService.currentUserScope())));
    }

    /**
     * Delete a unit (soft-delete). Fails if the unit has children.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'orgunit:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        Operator op = getOperator();
        entityManager.clear();
        organizationService.delete(id, op.id(), op.name(), orgUnitScopeService.currentUserScope());
        return ResponseEntity.ok(ApiResponse.success("Xóa đơn vị thành công", null));
    }

}
