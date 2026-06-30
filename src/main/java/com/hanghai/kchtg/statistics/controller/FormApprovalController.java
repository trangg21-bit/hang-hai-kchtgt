package com.hanghai.kchtg.statistics.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.statistics.entity.FormApprovalHistory;
import com.hanghai.kchtg.statistics.entity.StatisticsForm;
import com.hanghai.kchtg.statistics.service.FormApprovalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for approval workflow on statistics forms (Biểu).
 * Supports submit / approve / reject actions and approval history lookup.
 * Wave 3 part of M-017 "Thống kê chuyên đề".
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/statistics/forms")
@RequiredArgsConstructor
public class FormApprovalController {

    private final FormApprovalService formApprovalService;

    /**
     * Submit a statistics form for approval (DRAFT → SUBMITTED).
     * Records the action in form_approval_history.
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<?>> submit(
            @PathVariable Long id,
            @RequestParam String actor,
            @RequestParam(required = false) String comments) {
        log.info("Submitting form [{}] by actor={}", id, actor);
        StatisticsForm form = formApprovalService.submitForm(id, actor, comments);
        return ResponseEntity.ok(
                ApiResponse.success("Da gui form phê duyệt", form));
    }

    /**
     * Approve a submitted statistics form (SUBMITTED → APPROVED).
     * Records the action in form_approval_history.
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<?>> approve(
            @PathVariable Long id,
            @RequestParam String actor,
            @RequestParam(required = false) String comments) {
        log.info("Approving form [{}] by actor={}", id, actor);
        StatisticsForm form = formApprovalService.approveForm(id, actor, comments);
        return ResponseEntity.ok(
                ApiResponse.success("Phê duyệt form thành công", form));
    }

    /**
     * Reject a submitted statistics form (SUBMITTED → REJECTED).
     * Records the action in form_approval_history.
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<?>> reject(
            @PathVariable Long id,
            @RequestParam String actor,
            @RequestParam(required = false) String comments) {
        log.info("Rejecting form [{}] by actor={}", id, actor);
        StatisticsForm form = formApprovalService.rejectForm(id, actor, comments);
        return ResponseEntity.ok(
                ApiResponse.success("Từ chối form", form));
    }

    /**
     * Retrieve the full approval history for a statistics form,
     * ordered by creation date descending.
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<FormApprovalHistory>>> getHistory(
            @PathVariable Long id) {
        log.info("Fetching approval history for form [{}]", id);
        List<FormApprovalHistory> history = formApprovalService.getHistory(id);
        return ResponseEntity.ok(
                ApiResponse.success("Lay lich phê duyệt thành công", history));
    }
}
