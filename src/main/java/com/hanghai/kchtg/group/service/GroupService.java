package com.hanghai.kchtg.group.service;

import com.hanghai.kchtg.group.dto.CreateGroupRequest;
import com.hanghai.kchtg.group.dto.GroupResponse;
import com.hanghai.kchtg.group.dto.UpdateGroupRequest;
import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.group.repository.GroupRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service xu ly nghiep vu CRUD cho nhom nguoi dung.
 */
@Service
@Transactional
public class GroupService {

    private static final Logger log = LoggerFactory.getLogger(GroupService.class);

    private final GroupRepository repository;

    public GroupService(GroupRepository repository) {
        this.repository = repository;
    }

    // ── CREATE ──────────────────────────────────────────────────────

    /**
     * Tao moi mot nhom nguoi dung.
     *
     * @param request DTO chua thong tin nhom can tao
     * @return GroupResponse cua nhom vua tao
     * @throws IllegalArgumentException neu ma code da ton tai
     */
    public GroupResponse create(CreateGroupRequest request) {
        log.info("Creating group: code={}, name={}", request.getCode(), request.getName());

        if (repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Ma nhom '" + request.getCode() + "' da ton tai");
        }

        UserGroup entity = new UserGroup();
        entity.setName(request.getName());
        entity.setCode(request.getCode());
        entity.setDescription(request.getDescription());
        entity.setPermissions(request.getPermissions());
        entity.setStatus(request.getStatus() != null ? GroupStatus.valueOf(request.getStatus()) : GroupStatus.ACTIVE);

        UserGroup saved = repository.save(entity);
        log.info("Group created: id={}", saved.getId());
        return GroupResponse.from(saved);
    }

    // ── READ ────────────────────────────────────────────────────────

    /**
     * Lay danh sach tat ca nhom.
     */
    @Transactional(readOnly = true)
    public List<GroupResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(GroupResponse::from)
                .toList();
    }

    /**
     * Tim nhom theo ID.
     *
     * @param id UUID cua nhom
     * @return GroupResponse
     * @throws EntityNotFoundException neu khong tim thay
     */
    @Transactional(readOnly = true)
    public GroupResponse findById(UUID id) {
        UserGroup entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay nhom voi id=" + id));
        return GroupResponse.from(entity);
    }

    // ── UPDATE ──────────────────────────────────────────────────────

    /**
     * Cap nhat thong tin nhom. Ma code khong duoc thay doi.
     * Chi cap nhat nhung truong duoc gui (khac {@code null}).
     *
     * @param id      UUID cua nhom can cap nhat
     * @param request DTO chua cac truong co the cap nhat
     * @return GroupResponse sau khi cap nhat
     * @throws EntityNotFoundException neu khong tim thay nhom
     */
    public GroupResponse update(UUID id, UpdateGroupRequest request) {
        log.info("Updating group: id={}", id);

        UserGroup entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay nhom voi id=" + id));

        if (request.getName() != null) {
            entity.setName(request.getName());
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getPermissions() != null) {
            entity.setPermissions(request.getPermissions());
        }
        if (request.getStatus() != null) {
            entity.setStatus(GroupStatus.valueOf(request.getStatus()));
        }

        UserGroup saved = repository.save(entity);
        log.info("Group updated: id={}", saved.getId());
        return GroupResponse.from(saved);
    }

    // ── DELETE ──────────────────────────────────────────────────────

    /**
     * Xoa nhom theo ID (soft delete).
     *
     * @param id UUID cua nhom can xoa
     * @throws EntityNotFoundException neu khong tim thay
     */
    public void delete(UUID id) {
        log.info("Deleting group: id={}", id);

        UserGroup entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay nhom voi id=" + id));

        entity.softDelete();
        repository.save(entity);
        log.info("Soft-deleted group: id={}", id);
    }
}
