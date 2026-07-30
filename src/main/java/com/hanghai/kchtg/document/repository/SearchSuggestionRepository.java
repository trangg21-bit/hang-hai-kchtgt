package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.SearchSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SearchSuggestionRepository extends JpaRepository<SearchSuggestion, UUID> {

    List<SearchSuggestion> findByKeywordContainingIgnoreCase(String keyword);
}
