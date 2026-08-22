package com.hanghai.kchtg.user.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

/**
 * Notification service for account registration & password reset events.
 * Integrates with JavaMailSender (SMTP) with graceful fallback to server logging.
 */
@Component("userNotificationService")
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.frontend-url:http://localhost:3001}")
    private String frontendUrl;

    /**
     * Sends a verification email to the given address with the verification token.
     *
     * @param email recipient email
     * @param verificationToken plain token (not hashed) to embed in link
     * @param userId user ID
     */
    public void sendVerificationEmail(String email, String verificationToken, java.util.UUID userId) {
        String verificationLink = frontendUrl + "/verify?token=" + verificationToken;
        log.info("NOTIFICATION [VERIFY_EMAIL]: email={}, user={}, link={}", email, userId, verificationLink);

        if (mailSender != null && mailFrom != null && !mailFrom.isBlank()) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
                helper.setFrom(mailFrom);
                helper.setTo(email);
                helper.setSubject("[Cục Hàng hải Việt Nam] Xác thực tài khoản đăng ký");

                String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;\">"
                        + "<div style=\"text-align: center; margin-bottom: 20px;\">"
                        + "<h2 style=\"color: #12468C; margin: 0;\">HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI</h2>"
                        + "<p style=\"color: #666; margin: 5px 0 0 0;\">Cục Hàng hải Việt Nam</p>"
                        + "</div>"
                        + "<hr style=\"border: none; border-top: 1px solid #eee; margin: 20px 0;\" />"
                        + "<p>Xin chào,</p>"
                        + "<p>Bạn vừa đăng ký tài khoản trên Hệ thống TTQL KCHT Giao thông Hàng hải. Vui lòng bấm vào liên kết bên dưới để xác thực tài khoản:</p>"
                        + "<div style=\"text-align: center; margin: 30px 0;\">"
                        + "<a href=\"" + verificationLink + "\" style=\"background-color: #0E6FD6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;\">Xác thực tài khoản</a>"
                        + "</div>"
                        + "<p style=\"color: #666; font-size: 13px;\">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>"
                        + "</div>";

                mimeMessage.setContent(htmlContent, "text/html; charset=UTF-8");
                mailSender.send(mimeMessage);
                log.info("Email verification sent successfully to {}", email);
            } catch (Exception e) {
                log.error("Failed to send verification email to {}: {}", email, e.getMessage());
            }
        }
    }

    /**
     * Sends a registration success notification.
     */
    public void sendRegistrationSuccess(String email, java.util.UUID userId) {
        log.info("NOTIFICATION [REGISTER_SUCCESS]: email={}, user={}", email, userId);
    }

    /**
     * Sends a password reset notification via SMTP (or logs reset link).
     */
    public void sendPasswordResetEmail(String email, String resetToken) {
        String resetLink = frontendUrl + "/reset-password/" + resetToken;
        log.info("NOTIFICATION [PASSWORD_RESET]: email={}, token={}, resetLink={}", email, resetToken, resetLink);

        if (mailSender != null && mailFrom != null && !mailFrom.isBlank()) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
                helper.setFrom(mailFrom);
                helper.setTo(email);
                helper.setSubject("[Cục Hàng hải Việt Nam] Yêu cầu đặt lại mật khẩu");

                String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;\">"
                        + "<div style=\"text-align: center; margin-bottom: 20px;\">"
                        + "<h2 style=\"color: #12468C; margin: 0;\">HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI</h2>"
                        + "<p style=\"color: #666; margin: 5px 0 0 0;\">Cục Hàng hải Việt Nam</p>"
                        + "</div>"
                        + "<hr style=\"border: none; border-top: 1px solid #eee; margin: 20px 0;\" />"
                        + "<p>Xin chào,</p>"
                        + "<p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong>" + email + "</strong>.</p>"
                        + "<p>Để thiết lập mật khẩu mới, vui lòng bấm vào nút bên dưới:</p>"
                        + "<div style=\"text-align: center; margin: 30px 0;\">"
                        + "<a href=\"" + resetLink + "\" style=\"background-color: #0E6FD6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: bold; display: inline-block;\">Đặt lại mật khẩu</a>"
                        + "</div>"
                        + "<p style=\"color: #666; font-size: 13px;\">Hoặc sao chép liên kết sau vào trình duyệt:<br/><a href=\"" + resetLink + "\" style=\"color: #0E6FD6;\">" + resetLink + "</a></p>"
                        + "<p style=\"color: #E34948; font-size: 13px; font-style: italic;\">* Lưu ý: Liên kết có hiệu lực trong vòng 60 phút. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.</p>"
                        + "<hr style=\"border: none; border-top: 1px solid #eee; margin: 20px 0;\" />"
                        + "<p style=\"color: #999; font-size: 12px; text-align: center;\">Email này được gửi tự động từ Hệ thống QLKCHTGT Hàng Hải. Vui lòng không trả lời thư này.</p>"
                        + "</div>";

                mimeMessage.setContent(htmlContent, "text/html; charset=UTF-8");
                mailSender.send(mimeMessage);
                log.info("Sent password reset email successfully to {}", email);
            } catch (Exception e) {
                log.error("Failed to send password reset email to {}: {}", email, e.getMessage());
            }
        }
    }

    /**
     * Sends an SMS notification (placeholder).
     */
    public void sendSms(String phone, String message) {
        log.info("NOTIFICATION [SMS]: phone={}, message={}", phone, maskPhone(phone));
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return "****" + phone.substring(phone.length() - 4);
    }
}

