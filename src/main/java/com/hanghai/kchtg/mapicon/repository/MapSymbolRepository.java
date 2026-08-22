package com.hanghai.kchtg.mapicon.repository;

import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface MapSymbolRepository extends JpaRepository<MapSymbol, UUID> {

    @Query("SELECT s FROM MapSymbol s WHERE " +
           "(CAST(:search AS string) IS NULL OR " +
           "CAST(function('immutable_unaccent', LOWER(s.name)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) " +
           "OR CAST(function('immutable_unaccent', LOWER(s.description)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string)) " +
           "AND (:code IS NULL OR LOWER(s.code) LIKE LOWER(CONCAT('%', CAST(:code AS string), '%'))) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND s.deletedAt IS NULL")
    Page<MapSymbol> search(@Param("search") String search,
                           @Param("code") String code,
                           @Param("status") MapSymbolStatus status,
                           Pageable pageable);

    @Query("SELECT MAX(CAST(SUBSTRING(s.code, 4) AS integer)) FROM MapSymbol s")
    Integer findMaxCodeNumber();
}
