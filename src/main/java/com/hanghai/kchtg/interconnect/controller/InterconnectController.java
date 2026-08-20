package com.hanghai.kchtg.interconnect.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.interconnect.dto.DataSharingLogResponse;
import com.hanghai.kchtg.interconnect.dto.IntegrationConnectionResponse;
import com.hanghai.kchtg.interconnect.dto.IntegrationTransactionResponse;
import com.hanghai.kchtg.interconnect.dto.UpdateConnectionRequest;
import com.hanghai.kchtg.interconnect.service.InterconnectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/interconnect")
@RequiredArgsConstructor
@Validated
public class InterconnectController {

        private final InterconnectService interconnectService;

        /**
         * GET /api/interconnect/integration
         * List integration connections with optional filters.
         *
         * @param connectionName filter by connection name (optional)
         * @param senderSystem   filter by sender system (optional)
         * @param status         filter by connection status (optional)
         * @return list of integration connections
         */
        @PreAuthorize("@auth.check(authentication, 'connection:read') or @auth.check(authentication, 'interconnect:read')")
        @GetMapping("/integration")
        public ResponseEntity<ApiResponse<List<IntegrationConnectionResponse>>> listIntegrations(
                        @RequestParam(required = false) String connectionName,
                        @RequestParam(required = false) String senderSystem,
                        @RequestParam(required = false) String status) {
                log.info("Listing integration connections: connectionName={}, senderSystem={}, status={}",
                                connectionName, senderSystem, status);
                List<IntegrationConnectionResponse> result = interconnectService.listIntegrationConnections(
                                connectionName, senderSystem, status);
                return ResponseEntity.ok(
                                ApiResponse.success("Lấy danh sách kết nối liên thông thành công", result));
        }

        /**
         * GET /api/interconnect/integration/{id}/history
         * Get transaction history for a connection with advanced filters.
         *
         * @param id              connection UUID
         * @param type            filter by transaction type (optional)
         * @param referenceNumber filter by reference number (optional)
         * @param from            filter by sentAt >= from (optional)
         * @param to              filter by sentAt <= to (optional)
         * @param receiverCode    filter by receiver code (optional)
         * @param transactionId   filter by transaction id (optional)
         * @param purpose         filter by purpose (optional)
         * @return list of transaction history records
         */
        @PreAuthorize("@auth.check(authentication, 'connection:read') or @auth.check(authentication, 'interconnect:read')")
        @GetMapping("/integration/{id}/history")
        public ResponseEntity<ApiResponse<List<IntegrationTransactionResponse>>> getTransactionHistory(
                        @PathVariable UUID id,
                        @RequestParam(required = false) String type,
                        @RequestParam(required = false) String referenceNumber,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
                        @RequestParam(required = false) String receiverCode,
                        @RequestParam(required = false) String transactionId,
                        @RequestParam(required = false) String purpose) {
                log.info("Getting transaction history for connection id={}, type={}, ref={}, from={}, to={}",
                                id, type, referenceNumber, from, to);
                List<IntegrationTransactionResponse> result = interconnectService.getTransactionHistory(
                                id, type, referenceNumber, from, to, receiverCode, transactionId, purpose);
                return ResponseEntity.ok(
                                ApiResponse.success("Lấy lịch sử giao dịch thành công", result));
        }

        /**
         * GET /api/interconnect/integration/history/{id}/sent-content
         * Get the sent content of a transaction.
         *
         * @param id transaction UUID
         * @return sent content string
         */
        @PreAuthorize("@auth.check(authentication, 'connection:read') or @auth.check(authentication, 'interconnect:read')")
        @GetMapping("/integration/history/{id}/sent-content")
        public ResponseEntity<ApiResponse<String>> getSentContent(
                        @PathVariable UUID id) {
                log.info("Getting sent content for transaction id={}", id);
                String content = interconnectService.getSentContent(id);
                return ResponseEntity.ok(
                                ApiResponse.success("Lấy nội dung gửi thành công", content));
        }

        /**
         * GET /api/interconnect/integration/history/{id}/received-content
         * Get the received content of a transaction.
         *
         * @param id transaction UUID
         * @return received content string
         */
        @PreAuthorize("@auth.check(authentication, 'connection:read') or @auth.check(authentication, 'interconnect:read')")
        @GetMapping("/integration/history/{id}/received-content")
        public ResponseEntity<ApiResponse<String>> getReceivedContent(
                        @PathVariable UUID id) {
                log.info("Getting received content for transaction id={}", id);
                String content = interconnectService.getReceivedContent(id);
                return ResponseEntity.ok(
                                ApiResponse.success("Lấy nội dung nhận thành công", content));
        }

        /**
         * PUT /api/interconnect/integration/{id}
         * Update an integration connection.
         *
         * @param id  connection UUID
         * @param req update request body
         * @return updated connection
         */
        @PreAuthorize("@auth.check(authentication, 'connection:update') or @auth.check(authentication, 'connection:manage') or @auth.check(authentication, 'interconnect:update') or @auth.check(authentication, 'interconnect:manage') or @auth.check(authentication, 'connection:read')")
        @PutMapping("/integration/{id}")
        public ResponseEntity<ApiResponse<IntegrationConnectionResponse>> updateConnection(
                        @PathVariable UUID id,
                        @Valid @RequestBody UpdateConnectionRequest req) {
                log.info("Updating integration connection id={}", id);
                IntegrationConnectionResponse result = interconnectService.updateConnection(id, req);
                return ResponseEntity.ok(
                                ApiResponse.success("Cập nhật kết nối liên thông thành công", result));
        }

        /**
         * GET /api/interconnect/sharing
         * List all data sharing logs.
         *
         * @return list of sharing logs
         */
        @PreAuthorize("@auth.check(authentication, 'connection:read') or @auth.check(authentication, 'interconnect:read')")
        @GetMapping("/sharing")
        public ResponseEntity<ApiResponse<List<DataSharingLogResponse>>> listSharingLogs() {
                log.info("Listing data sharing logs");
                List<DataSharingLogResponse> result = interconnectService.listSharingLogs();
                return ResponseEntity.ok(
                                ApiResponse.success("Lấy danh sách nhật ký chia sẻ dữ liệu thành công", result));
        }

        /**
         * GET /api/interconnect/sharing/{id}
         * Get a data sharing log detail.
         *
         * @param id log UUID
         * @return sharing log detail
         */
        @PreAuthorize("@auth.check(authentication, 'connection:read') or @auth.check(authentication, 'interconnect:read')")
        @GetMapping("/sharing/{id}")
        public ResponseEntity<ApiResponse<DataSharingLogResponse>> getSharingLogDetail(
                        @PathVariable UUID id) {
                log.info("Getting sharing log detail id={}", id);
                DataSharingLogResponse result = interconnectService.getSharingLogDetail(id);
                return ResponseEntity.ok(
                                ApiResponse.success("Lấy chi tiết nhật ký chia sẻ dữ liệu thành công", result));
        }
}
