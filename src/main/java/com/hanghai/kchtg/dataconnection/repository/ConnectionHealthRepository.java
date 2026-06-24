package com.hanghai.kchtg.dataconnection.repository;

import com.hanghai.kchtg.dataconnection.entity.ConnectionHealth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link ConnectionHealth}.
 */
public interface ConnectionHealthRepository extends JpaRepository<ConnectionHealth, UUID> {

    /**
     * T́m tất cả health checks của một connection, sắp xếp giảm dần.
     */
    List<ConnectionHealth> findByConnectionIdOrderByCheckedAtDesc(UUID connectionId);

    /**
     * Health check mới nhất của một connection.
     */
    ConnectionHealth findFirstByConnectionIdOrderByCheckedAtDesc(UUID connectionId);

    /**
     * Đếm số health check thành công (status 200-299).
     */
    long countByConnectionIdAndStatusCodeBetween(UUID connectionId, int fromCode, int toCode);

    /**
     * T́m các health checks có lỗi trong khoảng thời gian.
     */
    @Query("SELECT h FROM ConnectionHealth h WHERE h.connectionId = :connectionId AND h.errorMessage IS NOT NULL AND h.checkedAt >= :since")
    List<ConnectionHealth> findErrorsSince(@Param("connectionId") UUID connectionId,
                                            @Param("since") LocalDateTime since);

    /**
     * Độ trễ trung bình của một connection trong khoảng thời gian.
     */
    @Query("SELECT AVG(h.latencyMs) FROM ConnectionHealth h WHERE h.connectionId = :connectionId AND h.checkedAt >= :since AND h.latencyMs IS NOT NULL")
    Double avgLatency(@Param("connectionId") UUID connectionId,
                      @Param("since") LocalDateTime since);

    /**
     * Xóa health checks cu hon threshold.
     */
    void deleteByCheckedAtBefore(LocalDateTime threshold);
}