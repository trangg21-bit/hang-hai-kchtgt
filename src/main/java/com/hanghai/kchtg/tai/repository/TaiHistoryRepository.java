package com.hanghai.kchtg.tai.repository;

import com.hanghai.kchtg.tai.entity.TaiHistory;
import com.hanghai.kchtg.tai.entity.TaiHistoryActionType;
import com.hanghai.kchtg.tai.entity.TaiType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.UUID;

@Repository
public interface TaiHistoryRepository extends JpaRepository<TaiHistory, UUID> {

    Page<TaiHistory> findByEntityIdAndTaiType(UUID entityId, TaiType taiType, Pageable pageable);

    Page<TaiHistory> findByEntityIdAndTaiTypeAndActionType(
            UUID entityId, TaiType taiType, TaiHistoryActionType actionType, Pageable pageable);

    Page<TaiHistory> findByTaiTypeAndActionType(
            TaiType taiType, TaiHistoryActionType actionType, Pageable pageable);

    Page<TaiHistory> findByTaiType(TaiType taiType, Pageable pageable);

    Page<TaiHistory> findByTaiTypeAndChangedAtBetween(
            TaiType taiType, Instant from, Instant to, Pageable pageable);
}
