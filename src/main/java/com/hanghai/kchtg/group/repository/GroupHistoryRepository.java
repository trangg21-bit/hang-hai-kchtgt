package com.hanghai.kchtg.group.repository;

import com.hanghai.kchtg.group.entity.GroupHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link GroupHistory}.
 */
@Repository
public interface GroupHistoryRepository extends JpaRepository<GroupHistory, UUID> {

    /**
     * TĂ¬m táº¥t cáº£ lá»‹ch sá»­ thay Ä‘á»•i cá»§a má»™t nhĂ³m, sáº¯p xáº¿p má»›i nháº¥t trÆ°á»›c.
     */
    List<GroupHistory> findByUserGroupIdOrderByChangeTimestampDesc(UUID userGroupId);

    /**
     * TĂ¬m lá»‹ch sá»­ trong khoáº£ng thá»i gian.
     */
    List<GroupHistory> findByChangeTimestampBetweenOrderByChangeTimestampDesc(
            LocalDateTime from, LocalDateTime to);

    /**
     * Äáº¿m sá»‘ láº§n thay Ä‘á»•i cá»§a má»™t nhĂ³m.
     */
    long countByUserGroupId(UUID userGroupId);
}
