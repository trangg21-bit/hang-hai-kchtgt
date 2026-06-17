package com.hanghai.kchtg.mapicon.repository;

import com.hanghai.kchtg.mapicon.entity.SymbolLibrary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link SymbolLibrary}.
 */
@Repository
public interface SymbolLibraryRepository extends JpaRepository<SymbolLibrary, UUID> {

    /**
     * T́m symbol theo code.
     */
    Optional<SymbolLibrary> findByCode(String code);

    /**
     * T́m symbol theo d?nh d?ng.
     */
    List<SymbolLibrary> findByFormat(SymbolLibrary.SymbolFormat format);

    /**
     * T́m symbol du?c upload b?i m?t ngu?i dùng c? th?.
     */
    List<SymbolLibrary> findByUploadedByOrderByUploadedAtDesc(UUID uploadedBy);

    /**
     * T́m symbol theo tên (like search).
     */
    @Query("SELECT s FROM SymbolLibrary s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<SymbolLibrary> searchByName(@Param("name") String name);

    /**
     * Ki?m tra code dă t?n t?i.
     */
    boolean existsByCode(String code);

    /**
     * Ki?m tra code dă t?n t?i ngoài ID này.
     */
    boolean existsByCodeAndIdNot(String code, UUID id);

    /**
     * Đ?m s? symbol theo d?nh d?ng.
     */
    long countByFormat(SymbolLibrary.SymbolFormat format);

    /**
     * T́m SLD symbols (cho GeoServer integration).
     */
    List<SymbolLibrary> findByFormatAndSldPathIsNotNull(SymbolLibrary.SymbolFormat format);
}
