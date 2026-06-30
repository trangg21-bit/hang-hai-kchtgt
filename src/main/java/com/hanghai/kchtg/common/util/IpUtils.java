package com.hanghai.kchtg.common.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Utility to extract the real client IP address from HTTP requests.
 */
public class IpUtils {

    private static final String[] HEADERS = {
        "CF-Connecting-IP",
        "X-Forwarded-For",
        "X-Real-IP",
        "Proxy-Client-IP",
        "WL-Proxy-Client-IP",
        "True-Client-IP"
    };

    /**
     * Extracts the real client IP address from the request headers, falling back
     * to the remote address if no proxy headers are found.
     *
     * @param request the HttpServletRequest
     * @return the client IP address, or "unknown" if not determinable
     */
    public static String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        for (String header : HEADERS) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
                if ("X-Forwarded-For".equalsIgnoreCase(header)) {
                    int commaIndex = ip.indexOf(',');
                    if (commaIndex != -1) {
                        return ip.substring(0, commaIndex).trim();
                    }
                }
                return ip.trim();
            }
        }
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null ? remoteAddr : "unknown";
    }
}
