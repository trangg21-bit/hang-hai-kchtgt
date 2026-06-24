package com.hanghai.kchtg.dataconnection.repository;

import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link SyncLog}.
 */
public interface SyncLogRepository extends JpaRepository<SyncLog, UUID> {

    /**
     * T́m tất cả sync logs của một connection, phân trang theo thời gian.
     */
    List<SyncLog> findByConnectionIdOrderByStartTimeDesc(UUID connectionId);

    /**
     * T́m sync log cuối cùng của một connection.
     */
    SyncLog findFirstByConnectionIdOrderByStartTimeDesc(UUID connectionId);

    /**
     * Đếm số lần sync thành công của một connection.
     */
    long countByConnectionIdAndStatus(UUID connectionId, SyncLog.SyncStatus status);

    /**
     * T́m tất cả sync logs đang chạy (status = RUNNING).
     */
    List<SyncLog> findByStatus(SyncLog.SyncStatus status);

    /**
     * T́m sync logs thất bại trong khoảng thời gian.
     */
    @Query("SELECT s FROM SyncLog s WHERE s.status = :status AND s.startTime BETWEEN :from AND :to")
    List<SyncLog> findFailedBetween(@Param("status") SyncLog.SyncStatus status,
                                     @Param("from") java.time.LocalDateTime from,
                                     @Param("to") java.time.LocalDateTime to);

    /**
     * Tổng số records đã sync cho một connection.
     */
    @Query("SELECT SUM(s.recordsProcessed) FROM SyncLog s WHERE s.connectionId = :connectionId AND s.status != :status")
    Long sumProcessed(@Param("connectionId") UUID connectionId,
                      @Param("status") SyncLog.SyncStatus status);
}