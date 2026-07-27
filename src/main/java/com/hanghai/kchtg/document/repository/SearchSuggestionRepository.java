package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.SearchSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchSuggestionRepository extends JpaRepository<SearchSuggestion, UUID> {

    List<SearchSuggestion> findByKeywordContainingIgnoreCase(String keyword);
}
