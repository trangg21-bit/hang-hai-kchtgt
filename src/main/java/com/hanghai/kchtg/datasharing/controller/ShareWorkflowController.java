package com.hanghai.kchtg.datasharing.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.datasharing.entity.ShareHistory;
import com.hanghai.kchtg.datasharing.entity.SharedData;
import com.hanghai.kchtg.datasharing.service.ShareWorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for quy trình chia sẻ dữ liệu KCHTGT (approval workflow).
 * Supports submit / approve / revoke actions and approval history lookup.
 * Wave 3 part of M-018 "Chia sẻ dữ liệu KCHTGT".
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/datasharing/shares")
@RequiredArgsConstructor
public class ShareWorkflowController {

    private final ShareWorkflowService shareWorkflowService;

    /**
     * Submit a shared data record for sharing (DRAFT → SHARED).
     * Records the action in share_history audit trail.
     *
     * @param id      the shared_data record ID
     * @param actor   the user or system actor performing the action
     * @param comments optional free-text comments about the submission
     * @return 200 OK with the updated SharedData entity
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<?>> submit(
            @PathVariable Long id,
            @RequestParam String actor,
            @RequestParam(required = false) String comments) {
        log.info("Submitting share [{}] by actor={}", id, actor);
        SharedData data = shareWorkflowService.submitForShare(id, actor, comments);
        return ResponseEntity.ok(
                ApiResponse.success("Đã gửi chia sẻ dữ liệu phê duyệt", data));
    }

    /**
     * Approve a submitted share request (SHARED → SHARED with approvedBy set).
     * Records the action in share_history audit trail.
     *
     * @param id       the shared_data record ID
     * @param actor    the approver user or system actor
     * @param comments optional free-text comments about the approval
     * @return 200 OK with the updated SharedData entity
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<?>> approve(
            @PathVariable Long id,
            @RequestParam String actor,
            @RequestParam(required = false) String comments) {
        log.info("Approving share [{}] by actor={}", id, actor);
        SharedData data = shareWorkflowService.approveShare(id, actor, comments);
        return ResponseEntity.ok(
                ApiResponse.success("Phê duyệt chia sẻ dữ liệu thành công", data));
    }

    /**
     * Revoke a previously shared data record (SHARED → REVOKED).
     * Records the action in share_history audit trail.
     *
     * @param id       the shared_data record ID
     * @param actor    the user or system actor performing the revocation
     * @param comments optional free-text comments about the revocation
     * @return 200 OK with the updated SharedData entity
     */
    @PostMapping("/{id}/revoke")
    public ResponseEntity<ApiResponse<?>> revoke(
            @PathVariable Long id,
            @RequestParam String actor,
            @RequestParam(required = false) String comments) {
        log.info("Revoking share [{}] by actor={}", id, actor);
        SharedData data = shareWorkflowService.revokeShare(id, actor, comments);
        return ResponseEntity.ok(
                ApiResponse.success("Đã thu hồi chia sẻ dữ liệu", data));
    }

    /**
     * Retrieve the full share history (audit trail) for a shared data record,
     * ordered by creation date descending.
     *
     * @param id the shared_data record ID
     * @return 200 OK with a list of ShareHistory entries
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<ShareHistory>>> getHistory(
            @PathVariable Long id) {
        log.info("Fetching share history for share [{}]", id);
        List<ShareHistory> history = shareWorkflowService.getHistory(id);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy lịch sử chia sẻ thành công", history));
    }
}
