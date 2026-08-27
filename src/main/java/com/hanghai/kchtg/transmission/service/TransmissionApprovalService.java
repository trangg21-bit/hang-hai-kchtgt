package com.hanghai.kchtg.transmission.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.transmission.dto.ApprovalRequest;
import com.hanghai.kchtg.transmission.dto.TransmissionResponse;
import com.hanghai.kchtg.transmission.entity.Transmission;
import com.hanghai.kchtg.transmission.repository.TransmissionRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Approval service for transmission entity.
 * Quy trình phê duyệt 2 cấp chuẩn M-1006, dùng chung
 * {@link InfrastructureApprovalService} giống module /vts-system.
 * Lịch sử đọc từ shared change_logs / approval_logs (như Port).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransmissionApprovalService {

  private final TransmissionRepository transmissionRepository;
  private final InfrastructureApprovalService approvalService;
  private final TransmissionService transmissionService;
  private final InfrastructureHistoryRepository historyRepository;
  private final ChangeLogRepository changeLogRepository;
  private final UserRepository userRepository;

  @Transactional
  public TransmissionResponse submit(UUID id, UUID userId) {
    Transmission entity = transmissionRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống truyền dẫn với id: " + id));

    approvalService.submit(entity, InfrastructureType.TRANSMISSION, userId);
    // Ghi nhận thông tin gửi phê duyệt (hiển thị tại drawer chi tiết)
    entity.setSubmittedDate(LocalDateTime.now());
    entity.setSubmittedBy(userId);
    entity.setApprovalContentLevel1(null);
    entity.setApprovalContentLevel2(null);
    Transmission saved = transmissionRepository.save(entity);
    return transmissionService.toResponse(saved);
  }

  @Transactional
  public TransmissionResponse approveC1(UUID id, ApprovalRequest request, UUID userId) {
    validateDecision(request);
    Transmission entity = transmissionRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống truyền dẫn với id: " + id));

    approvalService.approveC1(entity, InfrastructureType.TRANSMISSION, request.getDecision(), request.getReason(), userId);
    entity.setApprovalContentLevel1(request.getReason());
    Transmission saved = transmissionRepository.save(entity);
    return transmissionService.toResponse(saved);
  }

  @Transactional
  public TransmissionResponse approveC2(UUID id, ApprovalRequest request, UUID userId) {
    validateDecision(request);
    Transmission entity = transmissionRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống truyền dẫn với id: " + id));

    approvalService.approveC2(entity, InfrastructureType.TRANSMISSION, request.getDecision(), request.getReason(), userId);
    entity.setApprovalContentLevel2(request.getReason());
    Transmission saved = transmissionRepository.save(entity);
    return transmissionService.toResponse(saved);
  }

  private void validateDecision(ApprovalRequest request) {
    if (request == null || request.getDecision() == null
      || !(ApprovalStatus.APPROVED.name().equalsIgnoreCase(request.getDecision())
      || ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision()))) {
      throw new IllegalArgumentException("Quyết định phê duyệt không hợp lệ");
    }
    if (ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())
      && (request.getReason() == null || request.getReason().trim().isEmpty())) {
      throw new IllegalArgumentException("Lý do từ chối là bắt buộc");
    }
  }

  @Transactional(readOnly = true)
  public Map<String, Object> getHistory(UUID id) {
    Transmission entity = transmissionRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống truyền dẫn với id: " + id));

    String entityId = id.toString();
    String entityType = "TRANSMISSION";

    // Vết phê duyệt: InfrastructureApprovalService ghi vào infrastructure_history
    // (chuẩn /vts-system) — gửi duyệt, duyệt C1/C2, từ chối, xóa, lưu và phê duyệt.
    List<Map<String, Object>> approvalHistory = historyRepository
      .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.TRANSMISSION, id)
      .stream()
      .map(this::toApprovalHistoryView)
      .toList();
    // Nhật ký thay đổi: chỉ ghi khi "Lưu và phê duyệt" hồ sơ ĐÃ DUYỆT (change_logs dùng chung).
    List<ChangeLog> changeLog = changeLogRepository.findByEntityTypeAndEntityId(entityType, entityId);

    return Map.of(
      "entityId", entityId,
      "entityType", entityType,
      "currentApprovalStatus", entity.getApprovalStatus(),
      "approvalHistory", approvalHistory,
      "changeHistory", changeLog
    );
  }

  private Map<String, Object> toApprovalHistoryView(InfrastructureHistory h) {
    Map<String, Object> m = new HashMap<>();
    m.put("id", h.getId());
    m.put("approvalLevel", h.getApprovalLevel() != null ? h.getApprovalLevel().name() : null);
    m.put("status", h.getStatus() != null ? h.getStatus().name() : null);
    m.put("approvedBy", h.getApprovedBy());
    m.put("approvedByName", resolveUserName(h.getApprovedBy()));
    m.put("approvedDate", h.getApprovedDate());
    m.put("reason", h.getReason());
    m.put("changedField", h.getChangedField());
    m.put("previousValue", h.getPreviousValue());
    m.put("newValue", h.getNewValue());
    return m;
  }

  private String resolveUserName(UUID userId) {
    if (userId == null) return null;
    return userRepository.findById(userId).map(this::formatUserIdentity).orElse(null);
  }

  private String formatUserIdentity(User user) {
    if (user == null) return null;
    if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
      return user.getFullName().trim();
    }
    if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
      return user.getUsername().trim();
    }
    return null;
  }

  @Transactional(readOnly = true)
  public Map<String, Object> getAllHistory() {
    String entityType = "TRANSMISSION";
    List<ChangeLog> changeLog = changeLogRepository.findByEntityType(entityType);
    List<InfrastructureHistory> list = historyRepository.findAll();
    Map<String, String> entityNames = new HashMap<>();
    for (InfrastructureHistory logItem : list) {
      if (logItem.getRefId() != null) {
        String refIdStr = logItem.getRefId().toString();
        if (!entityNames.containsKey(refIdStr)) {
          try {
            transmissionRepository.findById(logItem.getRefId())
              .ifPresent(c -> entityNames.put(refIdStr, c.getDeviceName()));
          } catch (Exception e) {
            entityNames.put(refIdStr, refIdStr);
          }
        }
      }
    }
    return Map.of("entityType", entityType, "changeHistory", changeLog, "entityNames", entityNames);
  }
}
