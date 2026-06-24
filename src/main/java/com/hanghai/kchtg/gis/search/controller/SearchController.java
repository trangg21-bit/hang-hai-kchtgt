package com.hanghai.kchtg.gis.search.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.search.dto.SearchHistoryResponse;
import com.hanghai.kchtg.gis.search.dto.SearchRequest;
import com.hanghai.kchtg.gis.search.dto.SearchResponse;
import com.hanghai.kchtg.gis.search.service.SearchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @PostMapping
    public ResponseEntity<ApiResponse<SearchResponse>> search(
            @Valid @RequestBody SearchRequest request) {
        SearchResponse response = searchService.search(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SearchHistoryResponse>>> getSearchHistory(
            @RequestParam(defaultValue = "20") int limit) {
        // TODO: Get userId from SecurityContext
        Long userId = 0L;
        List<SearchHistoryResponse> history = searchService.getSearchHistory(userId, limit);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse<Void>> clearSearchHistory() {
        // TODO: Get userId from SecurityContext
        Long userId = 0L;
        searchService.clearSearchHistory(userId);
        return ResponseEntity.ok(ApiResponse.success("Search history cleared", null));
    }
}