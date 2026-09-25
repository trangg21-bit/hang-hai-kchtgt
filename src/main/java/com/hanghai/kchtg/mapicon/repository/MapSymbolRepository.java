package com.hanghai.kchtg.mapicon.repository;

import com.hanghai.kchtg.mapicon.dto.MapSymbolOptionResponse;
import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MapSymbolRepository extends JpaRepository<MapSymbol, UUID> {

    @Query("SELECT new com.hanghai.kchtg.mapicon.dto.MapSymbolOptionResponse(s.id, s.name, s.code, s.image) " +
           "FROM MapSymbol s " +
           "WHERE s.status = com.hanghai.kchtg.mapicon.entity.MapSymbolStatus.ACTIVE " +
           "AND s.deletedAt IS NULL " +
           "ORDER BY s.name ASC")
    List<MapSymbolOptionResponse> findOptions();

    @Query("SELECT s FROM MapSymbol s WHERE " +
           "(CAST(:search AS string) IS NULL OR " +
           "CAST(function('immutable_unaccent', LOWER(s.name)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) " +
           "OR CAST(function('immutable_unaccent', LOWER(s.description)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string)) " +
           "AND (:code IS NULL OR LOWER(s.code) LIKE LOWER(CONCAT('%', CAST(:code AS string), '%'))) " +
           "AND (CAST(:name AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(s.name)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:name AS string), '%'))) AS string)) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:isDeleted IS NULL OR (:isDeleted = true AND s.deletedAt IS NOT NULL) OR (:isDeleted = false AND s.deletedAt IS NULL)) " +
           "AND (CAST(:fromUpdatedDate AS timestamp) IS NULL OR s.updatedAt >= :fromUpdatedDate) " +
           "AND (CAST(:toUpdatedDate AS timestamp) IS NULL OR s.updatedAt <= :toUpdatedDate)")
    Page<MapSymbol> search(@Param("search") String search,
                           @Param("code") String code,
                           @Param("name") String name,
                           @Param("status") MapSymbolStatus status,
                           @Param("isDeleted") Boolean isDeleted,
                           @Param("fromUpdatedDate") LocalDateTime fromUpdatedDate,
                           @Param("toUpdatedDate") LocalDateTime toUpdatedDate,
                           Pageable pageable);

    @Query("SELECT MAX(CAST(SUBSTRING(s.code, 4) AS integer)) FROM MapSymbol s")
    Integer findMaxCodeNumber();

    @Query("SELECT s FROM MapSymbol s WHERE s.code = :code AND s.deletedAt IS NULL")
    Optional<MapSymbol> findByCode(@Param("code") String code);
}

