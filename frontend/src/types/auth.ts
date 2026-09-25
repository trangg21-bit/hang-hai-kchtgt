export interface LoginRequest {
  identifier: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
}

export interface CaptchaData {
  captchaId: string;
  imageBase64: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  username: string;
  fullName: string;
  role: string;
}
