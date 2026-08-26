package com.hanghai.kchtg.common.util;

import com.hanghai.kchtg.common.dto.ApprovalRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;

import java.util.Map;

/**
 * Utility helper xử lý chuẩn hóa tham số phê duyệt (decision, reason) từ request.
 */
public final class ApprovalUtils {

    private ApprovalUtils() {
        // Utility class
    }

    public static String resolveDecision(ApprovalRequest request, ApprovalStatus defaultStatus) {
        if (request == null) {
            return defaultStatus != null ? defaultStatus.name() : ApprovalStatus.APPROVED.name();
        }
        return request.resolveDecision(defaultStatus);
    }

    public static String resolveDecision(ApprovalRequest request) {
        return resolveDecision(request, ApprovalStatus.APPROVED);
    }

    public static String resolveReason(ApprovalRequest request, String defaultReason) {
        if (request == null) {
            return defaultReason;
        }
        return request.resolveReason(defaultReason);
    }

    public static String resolveReason(ApprovalRequest request) {
        return resolveReason(request, null);
    }

    public static String resolveDecision(Map<String, String> body, ApprovalStatus defaultStatus) {
        if (body == null) {
            return defaultStatus != null ? defaultStatus.name() : ApprovalStatus.APPROVED.name();
        }
        String decision = body.get(ApprovalRequest.Fields.decision);
        if (StringUtils.isBlank(decision)) {
            return defaultStatus != null ? defaultStatus.name() : ApprovalStatus.APPROVED.name();
        }
        return decision.trim().toUpperCase();
    }

    public static String resolveDecision(Map<String, String> body) {
        return resolveDecision(body, ApprovalStatus.APPROVED);
    }

    public static String resolveReason(Map<String, String> body, String defaultReason) {
        if (body == null) {
            return defaultReason;
        }
        return StringUtils.defaultIfBlank(body.get(ApprovalRequest.Fields.reason), defaultReason);
    }

    public static String resolveReason(Map<String, String> body) {
        return resolveReason(body, null);
    }
}
