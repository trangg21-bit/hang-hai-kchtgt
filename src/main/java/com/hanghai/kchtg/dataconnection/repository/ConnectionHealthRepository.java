package com.hanghai.kchtg.dataconnection.repository;

import com.hanghai.kchtg.dataconnection.entity.ConnectionHealth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link ConnectionHealth}.
 */
@Repository
public interface ConnectionHealthRepository extends JpaRepository<ConnectionHealth, UUID> {

    /**
     * T́m t?t c? health checks c?a m?t connection, s?p x?p gi?m d?n.
     */
    List<ConnectionHealth> findByConnectionIdOrderByCheckedAtDesc(UUID connectionId);

    /**
     * Health check m?i nh?t c?a m?t connection.
     */
    ConnectionHealth findFirstByConnectionIdOrderByCheckedAtDesc(UUID connectionId);

    /**
     * Đ?m s? health check thành công (status 200-299).
     */
    long countByConnectionIdAndStatusCodeBetween(UUID connectionId, int fromCode, int toCode);

    /**
     * T́m các health checks có l?i trong kho?ng th?i gian.
     */
    @Query("SELECT h FROM ConnectionHealth h WHERE h.connectionId = :connectionId AND h.errorMessage IS NOT NULL AND h.checkedAt >= :since")
    List<ConnectionHealth> findErrorsSince(@Param("connectionId") UUID connectionId,
                                            @Param("since") LocalDateTime since);

    /**
     * Đ? tr? trung b́nh c?a m?t connection trong kho?ng th?i gian.
     */
    @Query("SELECT AVG(h.latencyMs) FROM ConnectionHealth h WHERE h.connectionId = :connectionId AND h.checkedAt >= :since AND h.latencyMs IS NOT NULL")
    Double avgLatency(@Param("connectionId") UUID connectionId,
                      @Param("since") LocalDateTime since);

    /**
     * Xóa health checks cu hon threshold.
     */
    void deleteByCheckedAtBefore(LocalDateTime threshold);
}
