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
 * Service xử lý nghiệp vụ CRUD cho nhóm người dùng.
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
     * Tạo mới một nhóm người dùng.
     *
     * @param request DTO chứa thông tin nhóm cần tạo
     * @return GroupResponse của nhóm vừa tạo
     * @throws IllegalArgumentException nếu mã code đã tồn tại
     */
    public GroupResponse create(CreateGroupRequest request) {
        log.info("Creating group: code={}, name={}", request.getCode(), request.getName());

        if (repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã nhóm '" + request.getCode() + "' đã tồn tại");
        }

        UserGroup entity = new UserGroup();
        entity.setName(request.getName());
        entity.setCode(request.getCode());
        entity.setDescription(request.getDescription());
        entity.setPermissions(request.getPermissions());
        entity.setStatus(request.getStatus() != null ? request.getStatus() : GroupStatus.ACTIVE);

        UserGroup saved = repository.save(entity);
        log.info("Group created: id={}", saved.getId());
        return GroupResponse.from(saved);
    }

    // ── READ ────────────────────────────────────────────────────────

    /**
     * Lấy danh sách tất cả nhóm.
     */
    @Transactional(readOnly = true)
    public List<GroupResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(GroupResponse::from)
                .toList();
    }

    /**
     * Tìm nhóm theo ID.
     *
     * @param id UUID của nhóm
     * @return GroupResponse
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public GroupResponse findById(UUID id) {
        UserGroup entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhóm với id=" + id));
        return GroupResponse.from(entity);
    }

    // ── UPDATE ──────────────────────────────────────────────────────

    /**
     * Cập nhật thông tin nhóm. Mã code không được thay đổi.
     * Chỉ cập nhật những trường được gửi (khác {@code null}).
     *
     * @param id      UUID của nhóm cần cập nhật
     * @param request DTO chứa các trường có thể cập nhật
     * @return GroupResponse sau khi cập nhật
     * @throws EntityNotFoundException nếu không tìm thấy nhóm
     */
    public GroupResponse update(UUID id, UpdateGroupRequest request) {
        log.info("Updating group: id={}", id);

        UserGroup entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhóm với id=" + id));

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
            entity.setStatus(request.getStatus());
        }

        UserGroup saved = repository.save(entity);
        log.info("Group updated: id={}", saved.getId());
        return GroupResponse.from(saved);
    }

    // ── DELETE ──────────────────────────────────────────────────────

    /**
     * Xoá nhóm theo ID.
     *
     * @param id UUID của nhóm cần xoá
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    public void delete(UUID id) {
        log.info("Deleting group: id={}", id);

        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy nhóm với id=" + id);
        }

        repository.deleteById(id);
        log.info("Group deleted: id={}", id);
    }
}
