package com.hanghai.kchtg.common.exception;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.exception.ValidationException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import org.apache.catalina.connector.ClientAbortException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global exception handler that converts known exceptions into
 * {@link ApiResponse} payloads with appropriate HTTP status codes.
 * <p>
 * Covered:
 * <ul>
 * <li>{@code @Valid} request-body validation → 400</li>
 * <li>{@code @Validated} path-variable / query-param validation → 400</li>
 * <li>JPA entity not found → 404</li>
 * <li>Illegal arguments → 400</li>
 * <li>Unhandled exceptions → 500 (message hidden in production by
 * {@code application.yml + logging}</li>
 * </ul>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles {@code @Valid} failures on {@code @RequestBody} parameters.
     * Returns a map of field → error message.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

        log.debug("Validation failed: {}", fieldErrors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed", fieldErrors));
    }

    /**
     * Handles {@code @Validated} constraint violations on path variables,
     * query parameters, or service-layer calls.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolation(
            ConstraintViolationException ex) {

        Map<String, String> errors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String path = violation.getPropertyPath().toString();
            // Use leaf property name to avoid long dotted paths
            String field = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
            errors.put(field, violation.getMessage());
        });

        log.debug("Constraint violation: {}", errors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed", errors));
    }

    /**
     * Handles JPA {@code EntityNotFoundException} - typically thrown by
     * {@code getReferenceById()} when the entity does not exist.
     */
    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<String>> handleEntityNotFound(
            jakarta.persistence.EntityNotFoundException ex) {

        log.debug("Entity not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<String>> handleNoResourceFound(
            org.springframework.web.servlet.resource.NoResourceFoundException ex) {

        log.debug("Resource not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Không tìm thấy tài nguyên: " + ex.getResourcePath()));
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<String>> handleMethodArgumentTypeMismatch(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        log.warn("Method argument type mismatch: parameter '{}', value '{}'", ex.getName(), ex.getValue());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Tham số '" + ex.getName() + "' không đúng định dạng mong muốn: " + ex.getValue()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<String>> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex) {

        log.warn("Upload size limit exceeded: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error("Dung lượng file tải lên vượt quá giới hạn cho phép (tối đa 20MB/file, tối đa 10 file mỗi lần)"));
    }

    /**
     * Handles {@code IllegalArgumentException} from service-layer guard
     * clauses (dispatched as 400 Bad Request).
     */
    @ExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class })
    public ResponseEntity<ApiResponse<String>> handleIllegalArgumentOrState(
            Exception ex) {

        log.debug("Validation state or argument exception: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Database unique constraints remain the final guard against concurrent
     * requests.
     * Convert the case-insensitive email constraint into the same validation
     * response
     * returned by {@code UserService}.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<String>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex) {

        String detail = ex.getMostSpecificCause().getMessage();
        if (detail != null && detail.contains("uk_app_users_email_case_insensitive")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Email đã tồn tại"));
        }

        if (detail != null && detail.contains("loai_van_ban_check")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Loại văn bản không hợp lệ"));
        }

        if (detail != null && detail.contains("tinh_trang_hieu_luc_check")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Tình trạng hiệu lực không hợp lệ"));
        }

        if (detail != null && detail.contains("fk_vts_system_province")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Địa điểm (Tỉnh/Thành phố) được chọn không tồn tại trong hệ thống"));
        }

        if (detail != null && (detail.contains("vts_system_code_key") || detail.contains("uk_vts_system_code") || detail.contains("idx_vts_system_code"))) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Mã hệ thống VTS đã tồn tại trong hệ thống. Vui lòng nhập mã khác."));
        }

        if (detail != null && (detail.contains("vts_operation_center_code_key") || detail.contains("uk_vts_operation_center_code") || detail.contains("idx_vts_operation_center_code"))) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Mã trung tâm điều hành VTS đã tồn tại trong hệ thống. Vui lòng nhập mã khác."));
        }

        if (detail != null && (detail.contains("ais_system_code_key") || detail.contains("uk_ais_system_code") || detail.contains("idx_ais_system_code"))) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Mã hệ thống AIS đã tồn tại trong hệ thống. Vui lòng nhập mã khác."));
        }

        if (detail != null && (detail.contains("violates unique constraint") || detail.contains("duplicate key value"))) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Mã hoặc dữ liệu định danh đã tồn tại trong hệ thống. Vui lòng kiểm tra lại."));
        }

        log.warn("Data integrity violation: {}", detail);
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("Dữ liệu đã tồn tại hoặc không hợp lệ"));
    }

    @ExceptionHandler(com.hanghai.kchtg.user.exception.DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<String>> handleDuplicateResource(
            com.hanghai.kchtg.user.exception.DuplicateResourceException ex) {
        log.warn("Duplicate resource exception: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(com.hanghai.kchtg.user.exception.RegistrationException.class)
    public ResponseEntity<ApiResponse<String>> handleRegistrationException(
            com.hanghai.kchtg.user.exception.RegistrationException ex) {
        log.warn("Registration exception: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<String>> handleValidationException(ValidationException ex) {
        log.debug("Validation exception: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handles
     * {@link org.springframework.http.converter.HttpMessageNotReadableException} -
     * typically thrown when
     * JSON payload is malformed, field values are out of bounds or types don't
     * match.
     */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<String>> handleHttpMessageNotReadable(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.debug("Http message not readable: {}", ex.getMessage());
        String msg = "Dữ liệu yêu cầu không hợp lệ hoặc sai định dạng";

        Throwable cause = ex.getCause();
        boolean foundSpecific = false;
        while (cause != null) {
            if (cause instanceof com.fasterxml.jackson.databind.exc.InvalidFormatException) {
                com.fasterxml.jackson.databind.exc.InvalidFormatException ife = (com.fasterxml.jackson.databind.exc.InvalidFormatException) cause;
                msg += ": giá trị '" + ife.getValue() + "' không đúng định dạng mong muốn";
                foundSpecific = true;
                break;
            } else if (cause instanceof com.fasterxml.jackson.core.exc.InputCoercionException) {
                msg += ": giá trị số vượt quá giới hạn cho phép";
                foundSpecific = true;
                break;
            }
            cause = cause.getCause();
        }

        if (!foundSpecific && ex.getCause() != null) {
            msg += ": Vui lòng kiểm tra lại kiểu dữ liệu của các trường";
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(msg));
    }

    /**
     * Handles UnauthorizedIntegrationException when pre-shared token is invalid or
     * missing.
     */
    @ExceptionHandler(UnauthorizedIntegrationException.class)
    public ResponseEntity<ApiResponse<String>> handleUnauthorizedIntegration(
            UnauthorizedIntegrationException ex) {
        log.debug("Unauthorized integration token access: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Rethrows Spring Security access/authorization exceptions so that the
     * security filter chain (ExceptionTranslationFilter) can handle them (e.g.
     * returning 401 Unauthorized or 403 Forbidden).
     */
    @ExceptionHandler({ AccessDeniedException.class, AuthorizationDeniedException.class })
    public void handleAccessDenied(Exception ex) throws Exception {
        throw ex;
    }

    /**
     * Handles client disconnect / abort exceptions silently (e.g. when user closes browser tab,
     * refreshes page, or aborts an active in-flight request).
     */
    @ExceptionHandler({
            ClientAbortException.class,
            AsyncRequestNotUsableException.class
    })
    public void handleClientAbort(Exception ex) {
        log.debug("Client connection closed/aborted: {}", ex.getMessage());
    }

    @ExceptionHandler(IOException.class)
    public void handleIOException(IOException ex) {
        String msg = ex.getMessage();
        if (msg != null && (msg.contains("aborted") || msg.contains("Broken pipe") || msg.contains("Connection reset"))) {
            log.debug("Client socket aborted: {}", msg);
            return;
        }
        log.warn("IO exception during request processing: {}", msg);
    }

    /**
     * Catch-all for any exception not handled by the specialised handlers above.
     * Logs the full stack-trace at WARN level and returns 500.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleGeneric(Exception ex) {
        // Suppress client aborts wrapped in other exceptions
        Throwable cause = ex;
        while (cause != null) {
            if (cause instanceof ClientAbortException
                    || cause instanceof AsyncRequestNotUsableException) {
                log.debug("Suppressed wrapped client abort exception: {}", cause.getMessage());
                return null;
            }
            if (cause instanceof IOException ioEx && ioEx.getMessage() != null
                    && (ioEx.getMessage().contains("aborted") || ioEx.getMessage().contains("Broken pipe") || ioEx.getMessage().contains("Connection reset"))) {
                log.debug("Suppressed wrapped client socket abort: {}", ioEx.getMessage());
                return null;
            }
            cause = cause.getCause();
        }

        log.error("Unhandled exception", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal server error"));
    }
}
