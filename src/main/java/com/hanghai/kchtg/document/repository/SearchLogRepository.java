package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SearchLogRepository extends JpaRepository<SearchLog, UUID> {
}
