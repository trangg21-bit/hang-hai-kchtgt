package com.hanghai.kchtg.group.repository;

import com.hanghai.kchtg.group.entity.GroupHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link GroupHistory}.
 */
public interface GroupHistoryRepository extends JpaRepository<GroupHistory, UUID> {

    /**
     * Tim tat ca lich su thay doi cua mot nhom, sap xep moi nhat truoc (BR-009/015).
     */
    List<GroupHistory> findByUserGroupIdOrderByPerformedAtDesc(UUID userGroupId);

    /**
     * Tim lich su thay doi cua mot nhom, co phan trang, sap xep moi nhat truoc.
     */
    Page<GroupHistory> findByUserGroupIdOrderByPerformedAtDesc(UUID userGroupId, Pageable pageable);

    /**
     * Dem so lan thay doi cua mot nhom.
     */
    long countByUserGroupId(UUID userGroupId);
}
