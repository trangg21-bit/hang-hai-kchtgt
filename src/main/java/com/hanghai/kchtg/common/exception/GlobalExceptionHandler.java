package com.hanghai.kchtg.common.exception;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.exception.ValidationException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global exception handler that converts known exceptions into
 * {@link ApiResponse} payloads with appropriate HTTP status codes.
 * <p>
 * Covered:
 * <ul>
 *   <li>{@code @Valid} request-body validation → 400</li>
 *   <li>{@code @Validated} path-variable / query-param validation → 400</li>
 *   <li>JPA entity not found → 404</li>
 *   <li>Illegal arguments → 400</li>
 *   <li>Unhandled exceptions → 500 (message hidden in production by
 *       {@code application.yml + logging}</li>
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
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage()));

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

    /**
     * Handles {@code IllegalArgumentException} from service-layer guard
     * clauses (dispatched as 400 Bad Request).
     */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ApiResponse<String>> handleIllegalArgumentOrState(
            Exception ex) {

        log.debug("Validation state or argument exception: {}", ex.getMessage());
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
     * Handles {@link org.springframework.http.converter.HttpMessageNotReadableException} - typically thrown when
     * JSON payload is malformed, field values are out of bounds or types don't match.
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
                com.fasterxml.jackson.databind.exc.InvalidFormatException ife = 
                        (com.fasterxml.jackson.databind.exc.InvalidFormatException) cause;
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
     * Handles UnauthorizedIntegrationException when pre-shared token is invalid or missing.
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
    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
    public void handleAccessDenied(Exception ex) throws Exception {
        throw ex;
    }

    /**
     * Catch-all for any exception not handled by the specialised handlers above.
     * Logs the full stack-trace at WARN level and returns 500.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal server error"));
    }
}
