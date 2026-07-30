package com.hanghai.kchtg.interconnect.service;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.interconnect.dto.DataSharingLogResponse;
import com.hanghai.kchtg.interconnect.dto.IntegrationConnectionResponse;
import com.hanghai.kchtg.interconnect.dto.IntegrationTransactionResponse;
import com.hanghai.kchtg.interconnect.dto.UpdateConnectionRequest;
import com.hanghai.kchtg.interconnect.entity.DataSharingLog;
import com.hanghai.kchtg.interconnect.entity.IntegrationConnection;
import com.hanghai.kchtg.interconnect.entity.IntegrationTransaction;
import com.hanghai.kchtg.interconnect.repository.DataSharingLogRepository;
import com.hanghai.kchtg.interconnect.repository.IntegrationConnectionRepository;
import com.hanghai.kchtg.interconnect.repository.IntegrationTransactionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class InterconnectService {

  private final IntegrationConnectionRepository connectionRepository;
  private final IntegrationTransactionRepository transactionRepository;
  private final DataSharingLogRepository sharingLogRepository;

  // ─── Integration Connections ─────────────────────────────────────────

  /**
   * List integration connections with optional filters.
   *
   * @param connectionName filter by connection name (LIKE, case-insensitive)
   * @param senderSystem   filter by sender system (LIKE, case-insensitive)
   * @param status         filter by connection status (exact match)
   * @return list of connection responses
   */
  @Transactional(readOnly = true)
  public List<IntegrationConnectionResponse> listIntegrationConnections(
    String connectionName, String senderSystem, String status) {

    Specification<IntegrationConnection> spec = buildConnectionFilter(connectionName, senderSystem, status);

    List<IntegrationConnection> entities;
    entities = connectionRepository.findAll(spec, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));

    return entities.stream()
      .map(IntegrationConnectionResponse::new)
      .collect(Collectors.toList());
  }

  /**
   * Get a single integration connection by ID.
   *
   * @param id connection UUID
   * @return connection response
   * @throws RuntimeException if not found
   */
  @Transactional(readOnly = true)
  public IntegrationConnectionResponse getConnectionById(UUID id) {
    IntegrationConnection entity = connectionRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Không tìm thấy kết nối liên thông với ID: " + id));
    return new IntegrationConnectionResponse(entity);
  }

  /**
   * Update an existing integration connection.
   * Only the fields provided in the request will be updated.
   *
   * @param id  connection UUID
   * @param req update request with optional fields
   * @return updated connection response
   * @throws RuntimeException if not found
   */
  public IntegrationConnectionResponse updateConnection(UUID id, UpdateConnectionRequest req) {
    IntegrationConnection entity = connectionRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Không tìm thấy kết nối liên thông với ID: " + id));

    if (StringUtils.hasText(req.getConnectionName())) {
      entity.setConnectionName(req.getConnectionName().trim());
    }
    if (req.getPassword() != null) {
      // Lưu mật khẩu đã được mã hóa (encryption handled by caller infrastructure)
      entity.setPassword(req.getPassword());
    }
    if (req.getStatus() != null) {
      entity.setStatus(req.getStatus());
    }

    IntegrationConnection saved = connectionRepository.save(entity);
    log.info("Updated integration connection: id={}", saved.getId());
    return new IntegrationConnectionResponse(saved);
  }

  // ─── Transaction History ─────────────────────────────────────────────

  /**
   * Get transaction history for a connection with advanced filters.
   *
   * @param connectionId    connection UUID (required)
   * @param type            filter by transaction type
   * @param referenceNumber filter by reference number (LIKE)
   * @param from            filter by sentAt >= from
   * @param to              filter by sentAt <= to
   * @param receiverCode    filter by receiver code
   * @param transactionId   filter by transaction id (UUID string)
   * @param purpose         filter by purpose (LIKE)
   * @return list of transaction responses
   */
  @Transactional(readOnly = true)
  public List<IntegrationTransactionResponse> getTransactionHistory(
    UUID connectionId, String type, String referenceNumber,
    LocalDateTime from, LocalDateTime to,
    String receiverCode, String transactionId, String purpose) {

    Specification<IntegrationTransaction> spec = buildTransactionFilter(
      connectionId, type, referenceNumber, from, to, receiverCode, transactionId, purpose);

    List<IntegrationTransaction> entities = transactionRepository.findAll(
      spec, Sort.by(Sort.Direction.DESC, "sentAt"));

    return entities.stream()
      .map(IntegrationTransactionResponse::new)
      .collect(Collectors.toList());
  }

  /**
   * Get the sent content of a transaction.
   *
   * @param transactionId transaction UUID
   * @return the sent content string
   * @throws RuntimeException if not found
   */
  @Transactional(readOnly = true)
  public String getSentContent(UUID transactionId) {
    IntegrationTransaction entity = transactionRepository.findById(transactionId)
      .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch với ID: " + transactionId));
    return entity.getSentContent();
  }

  /**
   * Get the received content of a transaction.
   *
   * @param transactionId transaction UUID
   * @return the received content string
   * @throws RuntimeException if not found
   */
  @Transactional(readOnly = true)
  public String getReceivedContent(UUID transactionId) {
    IntegrationTransaction entity = transactionRepository.findById(transactionId)
      .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch với ID: " + transactionId));
    return entity.getReceivedContent();
  }

  // ─── Sharing Logs ────────────────────────────────────────────────────

  /**
   * List all data sharing logs ordered by createdAt descending.
   *
   * @return list of sharing log responses
   */
  @Transactional(readOnly = true)
  public List<DataSharingLogResponse> listSharingLogs() {
    List<DataSharingLog> entities = sharingLogRepository.findAll(
      Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
    return entities.stream()
      .map(DataSharingLogResponse::new)
      .collect(Collectors.toList());
  }

  /**
   * Get a single data sharing log by ID.
   *
   * @param id log UUID
   * @return sharing log response
   * @throws RuntimeException if not found
   */
  @Transactional(readOnly = true)
  public DataSharingLogResponse getSharingLogDetail(UUID id) {
    DataSharingLog entity = sharingLogRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Không tìm thấy nhật ký chia sẻ dữ liệu với ID: " + id));
    return new DataSharingLogResponse(entity);
  }

  // ─── Private helpers ─────────────────────────────────────────────────

  /**
   * Build a JPA Specification for filtering IntegrationConnection entities.
   */
  private Specification<IntegrationConnection> buildConnectionFilter(
    String connectionName, String senderSystem, String status) {

    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (StringUtils.hasText(connectionName)) {
        predicates.add(cb.like(
          cb.lower(root.get("connectionName")),
          "%" + connectionName.trim().toLowerCase() + "%"));
      }
      if (StringUtils.hasText(senderSystem)) {
        predicates.add(cb.like(
          cb.lower(root.get("senderSystem")),
          "%" + senderSystem.trim().toLowerCase() + "%"));
      }
      if (StringUtils.hasText(status)) {
        predicates.add(cb.equal(
          cb.lower(root.get("status")),
          status.trim().toLowerCase()));
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }

  /**
   * Build a JPA Specification for filtering IntegrationTransaction entities.
   */
  private Specification<IntegrationTransaction> buildTransactionFilter(
    UUID connectionId, String type, String referenceNumber,
    LocalDateTime from, LocalDateTime to,
    String receiverCode, String transactionId, String purpose) {

    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      // Required: connectionId
      predicates.add(cb.equal(root.get("connectionId"), connectionId));

      if (StringUtils.hasText(type)) {
        predicates.add(cb.equal(root.get("type"), type.trim()));
      }
      if (StringUtils.hasText(referenceNumber)) {
        predicates.add(cb.like(
          cb.lower(root.get("referenceNumber")),
          "%" + referenceNumber.trim().toLowerCase() + "%"));
      }
      if (from != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("sentAt"), from));
      }
      if (to != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("sentAt"), to));
      }
      if (StringUtils.hasText(receiverCode)) {
        predicates.add(cb.equal(root.get("receiverCode"), receiverCode.trim()));
      }
      if (StringUtils.hasText(transactionId)) {
        try {
          UUID tid = UUID.fromString(transactionId.trim());
          predicates.add(cb.equal(root.get("id"), tid));
        } catch (IllegalArgumentException e) {
          log.warn("Invalid transactionId UUID format: {}", transactionId);
          // If invalid UUID format, return no results by adding an impossible predicate
          predicates.add(cb.isFalse(cb.literal(true)));
        }
      }
      if (StringUtils.hasText(purpose)) {
        predicates.add(cb.like(
          cb.lower(root.get("purpose")),
          "%" + purpose.trim().toLowerCase() + "%"));
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}
