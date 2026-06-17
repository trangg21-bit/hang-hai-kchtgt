package com.hanghai.kchtg.mapicon.repository;

import com.hanghai.kchtg.mapicon.entity.SymbolUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link SymbolUsage}.
 */
@Repository
public interface SymbolUsageRepository extends JpaRepository<SymbolUsage, UUID> {

    /**
     * T́m t?t c? l?n s? d?ng c?a m?t symbol c? th?.
     */
    List<SymbolUsage> findBySymbolIdOrderByUsedAtDesc(UUID symbolId);

    /**
     * T́m t?t c? l?n s? d?ng c?a m?t symbol cho m?t lo?i object c? th?.
     */
    @Query("SELECT su FROM SymbolUsage su WHERE su.symbolId = :symbolId AND su.objectType = :objectType ORDER BY su.usedAt DESC")
    List<SymbolUsage> findBySymbolIdAndObjectType(@Param("symbolId") UUID symbolId,
                                                   @Param("objectType") String objectType);

    /**
     * Đ?m s? l?n s? d?ng c?a m?t symbol.
     */
    long countBySymbolId(UUID symbolId);

    /**
     * Đ?m s? l?n s? d?ng c?a m?t symbol cho m?t lo?i object.
     */
    long countBySymbolIdAndObjectType(UUID symbolId, String objectType);

    /**
     * T́m t?t c? symbol du?c s? d?ng g?n dây (trong 7 ngày).
     */
    @Query("SELECT DISTINCT su.symbolId FROM SymbolUsage su WHERE su.usedAt >= :since")
    List<UUID> findRecentSymbolIds(@Param("since") java.time.LocalDateTime since);
}
