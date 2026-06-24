package com.hanghai.kchtg.mapicon.repository;

import com.hanghai.kchtg.mapicon.entity.SymbolLibrary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link SymbolLibrary}.
 */
public interface SymbolLibraryRepository extends JpaRepository<SymbolLibrary, UUID> {

    /**
     * T́m symbol theo code.
     */
    Optional<SymbolLibrary> findByCode(String code);

    /**
     * T́m symbol theo đểnh đểng.
     */
    List<SymbolLibrary> findByFormat(SymbolLibrary.SymbolFormat format);

    /**
     * T́m symbol được upload bịi một người dùng cụ thể.
     */
    List<SymbolLibrary> findByUploadedByOrderByUploadedAtDesc(UUID uploadedBy);

    /**
     * T́m symbol theo tên (like search).
     */
    @Query("SELECT s FROM SymbolLibrary s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<SymbolLibrary> searchByName(@Param("name") String name);

    /**
     * Kiểm tra code đã tồn tại.
     */
    boolean existsByCode(String code);

    /**
     * Kiểm tra code đã tồn tại ngoài ID này.
     */
    boolean existsByCodeAndIdNot(String code, UUID id);

    /**
     * Đếm số symbol theo đểnh đểng.
     */
    long countByFormat(SymbolLibrary.SymbolFormat format);

    /**
     * T́m SLD symbols (cho GeoServer integration).
     */
    List<SymbolLibrary> findByFormatAndSldPathIsNotNull(SymbolLibrary.SymbolFormat format);
}