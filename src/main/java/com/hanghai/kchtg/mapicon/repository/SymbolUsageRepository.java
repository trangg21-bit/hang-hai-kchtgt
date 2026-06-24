package com.hanghai.kchtg.mapicon.repository;

import com.hanghai.kchtg.mapicon.entity.SymbolUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link SymbolUsage}.
 */
public interface SymbolUsageRepository extends JpaRepository<SymbolUsage, UUID> {

    /**
     * T́m tất cả lần sử dụng của một symbol cụ thể.
     */
    List<SymbolUsage> findBySymbolIdOrderByUsedAtDesc(UUID symbolId);

    /**
     * T́m tất cả lần sử dụng của một symbol cho một loại object cụ thể.
     */
    @Query("SELECT su FROM SymbolUsage su WHERE su.symbolId = :symbolId AND su.objectType = :objectType ORDER BY su.usedAt DESC")
    List<SymbolUsage> findBySymbolIdAndObjectType(@Param("symbolId") UUID symbolId,
                                                   @Param("objectType") String objectType);

    /**
     * Đếm số lần sử dụng của một symbol.
     */
    long countBySymbolId(UUID symbolId);

    /**
     * Đếm số lần sử dụng của một symbol cho một loại object.
     */
    long countBySymbolIdAndObjectType(UUID symbolId, String objectType);

    /**
     * T́m tất cả symbol được sử dụng gần đây (trong 7 ngày).
     */
    @Query("SELECT DISTINCT su.symbolId FROM SymbolUsage su WHERE su.usedAt >= :since")
    List<UUID> findRecentSymbolIds(@Param("since") java.time.LocalDateTime since);
}