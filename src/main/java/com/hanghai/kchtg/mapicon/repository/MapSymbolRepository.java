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
           "(:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.code) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:category IS NULL OR s.category = :category) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND s.deletedAt IS NULL")
    Page<MapSymbol> search(@Param("search") String search,
                           @Param("category") String category,
                           @Param("status") String status,
                           Pageable pageable);
}
