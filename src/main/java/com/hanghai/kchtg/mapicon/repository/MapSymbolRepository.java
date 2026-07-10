package com.hanghai.kchtg.mapicon.repository;

import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface MapSymbolRepository extends JpaRepository<MapSymbol, UUID> {
    Optional<MapSymbol> findByCode(String code);

    @Query("SELECT s FROM MapSymbol s WHERE " +
           "(CAST(:search AS string) IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(s.code) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(s.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND s.deletedAt IS NULL")
    Page<MapSymbol> search(@Param("search") String search,
                           @Param("status") Integer status,
                           Pageable pageable);
}
