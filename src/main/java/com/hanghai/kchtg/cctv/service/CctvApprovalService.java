package com.hanghai.kchtg.cctv.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.cctv.dto.ApprovalRequest;
import com.hanghai.kchtg.cctv.dto.CctvResponse;
import com.hanghai.kchtg.cctv.entity.Cctv;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
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
import java.text.Normalizer;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;

/**
 * Approval service for CCTV entity.
 * Quy trình phê duyệt 2 cấp chuẩn M-1006, dùng chung
 * {@link InfrastructureApprovalService} giống module /vts-system.
 * Lịch sử đọc từ shared change_logs / approval_logs (như Port).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CctvApprovalService {

  private final CctvRepository cctvRepository;
  private final InfrastructureApprovalService approvalService;
  private final CctvService cctvService;
  private final InfrastructureHistoryRepository historyRepository;
  private final ChangeLogRepository changeLogRepository;
  private final UserRepository userRepository;

  @Transactional
  public CctvResponse submit(UUID id, UUID userId) {
    return submit(id, null, userId);
  }

  @Transactional
  public CctvResponse submit(UUID id, String content, UUID userId) {
    Cctv entity = cctvRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));

    approvalService.submit(entity, InfrastructureType.CCTV, userId, content);
    // Ghi nhận thông tin gửi phê duyệt (hiển thị tại drawer chi tiết)
    entity.setSubmittedDate(LocalDateTime.now());
    entity.setSubmittedBy(userId);
    // Nội dung/ý kiến người gửi — hiển thị "Nội dung phê duyệt" (cấp 1) cho tới khi C1 ra quyết định
    entity.setApprovalContentLevel1(content != null && !content.trim().isEmpty() ? content.trim() : null);
    entity.setApprovalContentLevel2(null);
    Cctv saved = cctvRepository.save(entity);
    return cctvService.toResponse(saved);
  }

  @Transactional
  public CctvResponse approveC1(UUID id, ApprovalRequest request, UUID userId) {
    validateDecision(request);
    Cctv entity = cctvRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));

    approvalService.approveC1(entity, InfrastructureType.CCTV, request.getDecision(), request.getReason(), userId);
    entity.setApprovalContentLevel1(request.getReason());
    Cctv saved = cctvRepository.save(entity);
    return cctvService.toResponse(saved);
  }

  @Transactional
  public CctvResponse approveC2(UUID id, ApprovalRequest request, UUID userId) {
    validateDecision(request);
    Cctv entity = cctvRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));

    approvalService.approveC2(entity, InfrastructureType.CCTV, request.getDecision(), request.getReason(), userId);
    entity.setApprovalContentLevel2(request.getReason());
    Cctv saved = cctvRepository.save(entity);
    return cctvService.toResponse(saved);
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

  public List<HistoryEntry> getHistory(UUID id) {
    return getHistory(id, null, null);
  }

  public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize) {
    return getHistory(id, page, pageSize, null, null, null);
  }

  public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
      LocalDateTime fromDate, LocalDateTime toDate) {
    ensureExists(id);
    List<InfrastructureHistory> list;
    if (page != null && pageSize != null && pageSize > 0) {
      Pageable pageable = PageRequest.of(page, pageSize);
      String normalizedKeyword = normalizeSearchKeyword(keyword);
      if (normalizedKeyword == null && fromDate == null && toDate == null) {
        list = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
            InfrastructureType.CCTV, id, pageable);
      } else {
        list = historyRepository.searchHistory(InfrastructureType.CCTV, id, normalizedKeyword,
            fromDate, toDate, pageable);
      }
    } else {
      list = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.CCTV, id);
    }
    Set<UUID> userIds = list.stream()
        .map(InfrastructureHistory::getApprovedBy)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());
    Map<UUID, User> userMap = resolveUsers(userIds);
    Map<UUID, String> userNameMap = new HashMap<>();
    userMap.forEach((userId, user) -> userNameMap.put(userId, formatUserIdentity(user)));

    return list.stream()
        .map(h -> HistoryEntry.builder()
            .id(h.getId())
            .approvalLevel(h.getApprovalLevel())
            .status(h.getStatus() != null ? h.getStatus().getCode() : null)
            .approvedBy(h.getApprovedBy() != null ? userNameMap.get(h.getApprovedBy()) : null)
            .orgUnitName(h.getApprovedBy() != null && userMap.get(h.getApprovedBy()) != null
                && userMap.get(h.getApprovedBy()).getOrgUnit() != null
                    ? userMap.get(h.getApprovedBy()).getOrgUnit().getName()
                    : null)
            .approvedDate(h.getApprovedDate())
            .reason(h.getReason())
            .changedField(h.getChangedField())
            .previousValue(h.getPreviousValue())
            .newValue(h.getNewValue())
            .build())
        .collect(Collectors.toList());
  }

  private void ensureExists(UUID id) {
    if (!cctvRepository.existsById(id)) {
      throw new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id);
    }
  }

  private static String normalizeSearchKeyword(String keyword) {
    if (keyword == null || keyword.trim().isEmpty()) {
      return null;
    }
    return Normalizer.normalize(keyword.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
        .replaceAll("\\p{M}+", "")
        .replace('đ', 'd');
  }

  private Map<UUID, User> resolveUsers(Collection<UUID> userIds) {
    if (userIds == null || userIds.isEmpty())
      return Collections.emptyMap();
    Set<UUID> nonNullIds = userIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
    if (nonNullIds.isEmpty())
      return Collections.emptyMap();
    return userRepository.findAllByIdInWithOrgUnit(nonNullIds).stream()
        .collect(Collectors.toMap(User::getId, user -> user, (first, second) -> first));
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

  public Map<String, Object> getAllHistory() {
    // Tạm thời trả null sạch theo yêu cầu — bảng change_logs chưa tồn tại trong DB (chờ fix gốc).
    return null;
  }
}
