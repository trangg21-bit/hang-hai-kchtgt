package com.hanghai.kchtg.group.repository;

import com.hanghai.kchtg.group.entity.GroupHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link GroupHistory}.
 */
public interface GroupHistoryRepository extends JpaRepository<GroupHistory, UUID> {

    /**
     * Tìm tất cả lịch sử thay đổi của một nhóm, sắp xếp mới nhất trước.
     */
    List<GroupHistory> findByUserGroupIdOrderByChangeTimestampDesc(UUID userGroupId);

    /**
     * Tìm lịch sử trong khoảng thời gian.
     */
    List<GroupHistory> findByChangeTimestampBetweenOrderByChangeTimestampDesc(
            LocalDateTime from, LocalDateTime to);

    /**
     * Đếm số lần thay đổi của một nhóm.
     */
    long countByUserGroupId(UUID userGroupId);
}