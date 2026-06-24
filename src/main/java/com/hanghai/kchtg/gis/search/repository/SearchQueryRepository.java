package com.hanghai.kchtg.gis.search.repository;

import com.hanghai.kchtg.gis.search.entity.SearchQuery;
import com.hanghai.kchtg.gis.search.entity.SearchQuery.QueryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;
public interface SearchQueryRepository extends JpaRepository<SearchQuery, UUID> {

    List<SearchQuery> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT sq FROM SearchQuery sq WHERE sq.userId = :userId " +
            "ORDER BY sq.createdAt DESC")
    Page<SearchQuery> findByUserId(Long userId, Pageable pageable);

    void deleteByCreatedAtBefore(java.time.LocalDateTime before);

    long countByCreatedAtAfter(java.time.LocalDateTime after);
}