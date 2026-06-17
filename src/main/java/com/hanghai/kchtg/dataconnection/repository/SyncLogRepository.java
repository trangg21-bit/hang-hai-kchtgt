package com.hanghai.kchtg.dataconnection.repository;

import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link SyncLog}.
 */
@Repository
public interface SyncLogRepository extends JpaRepository<SyncLog, UUID> {

    /**
     * T́m t?t c? sync logs c?a m?t connection, phân trang theo th?i gian.
     */
    List<SyncLog> findByConnectionIdOrderByStartTimeDesc(UUID connectionId);

    /**
     * T́m sync log cu?i cùng c?a m?t connection.
     */
    SyncLog findFirstByConnectionIdOrderByStartTimeDesc(UUID connectionId);

    /**
     * Đ?m s? l?n sync thành công c?a m?t connection.
     */
    long countByConnectionIdAndStatus(UUID connectionId, SyncLog.SyncStatus status);

    /**
     * T́m t?t c? sync logs dang ch?y (status = RUNNING).
     */
    List<SyncLog> findByStatus(SyncLog.SyncStatus status);

    /**
     * T́m sync logs th?t b?i trong kho?ng th?i gian.
     */
    @Query("SELECT s FROM SyncLog s WHERE s.status = :status AND s.startTime BETWEEN :from AND :to")
    List<SyncLog> findFailedBetween(@Param("status") SyncLog.SyncStatus status,
                                     @Param("from") java.time.LocalDateTime from,
                                     @Param("to") java.time.LocalDateTime to);

    /**
     * T?ng s? records dă sync cho m?t connection.
     */
    @Query("SELECT SUM(s.recordsProcessed) FROM SyncLog s WHERE s.connectionId = :connectionId AND s.status != :status")
    Long sumProcessed(@Param("connectionId") UUID connectionId,
                      @Param("status") SyncLog.SyncStatus status);
}
