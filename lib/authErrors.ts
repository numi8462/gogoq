import type { AuthError } from "@supabase/supabase-js";

export type AuthErrorField = "email" | "password";

type Mapped = { message: string; field?: AuthErrorField };

// Supabase Auth의 error.code → 한글 메시지 (+ 해당 입력 필드) 매핑
// 코드 목록: node_modules/@supabase/auth-js/src/lib/error-codes.ts
const AUTH_ERROR_MESSAGES: Partial<Record<string, Mapped>> = {
  weak_password: {
    message: "비밀번호가 너무 짧아요. 6자 이상 입력해주세요.",
    field: "password",
  },
  same_password: {
    message: "기존 비밀번호와 같아요. 다른 비밀번호를 입력해주세요.",
    field: "password",
  },
  user_already_exists: { message: "이미 가입된 이메일이에요.", field: "email" },
  email_exists: { message: "이미 가입된 이메일이에요.", field: "email" },
  email_address_invalid: {
    message: "올바른 이메일 형식이 아니에요.",
    field: "email",
  },
  email_address_not_authorized: {
    message: "허용되지 않은 이메일 주소예요.",
    field: "email",
  },
  user_not_found: { message: "가입되지 않은 이메일이에요.", field: "email" },
  invalid_credentials: {
    message: "이메일 또는 비밀번호가 올바르지 않아요.",
    field: "password",
  },
  email_not_confirmed: {
    message: "이메일 인증이 필요해요. 메일함을 확인해주세요.",
  },
  user_banned: { message: "이용이 제한된 계정이에요." },
  signup_disabled: { message: "현재 회원가입을 받고 있지 않아요." },
  email_provider_disabled: { message: "이메일 로그인이 비활성화되어 있어요." },
  captcha_failed: { message: "보안 확인에 실패했어요. 다시 시도해주세요." },
  over_email_send_rate_limit: {
    message: "이메일 요청이 너무 잦아요. 잠시 후 다시 시도해주세요.",
  },
  over_request_rate_limit: {
    message: "요청이 너무 많아요. 잠시 후 다시 시도해주세요.",
  },
  over_sms_send_rate_limit: {
    message: "요청이 너무 많아요. 잠시 후 다시 시도해주세요.",
  },
  bad_oauth_state: {
    message: "소셜 로그인 연동 중 문제가 발생했어요. 다시 시도해주세요.",
  },
  bad_oauth_callback: {
    message: "소셜 로그인 연동 중 문제가 발생했어요. 다시 시도해주세요.",
  },
  oauth_provider_not_supported: { message: "지원하지 않는 소셜 로그인이에요." },
  provider_disabled: { message: "해당 소셜 로그인이 비활성화되어 있어요." },
  identity_already_exists: {
    message: "이미 다른 계정에 연결된 소셜 계정이에요.",
  },
  validation_failed: { message: "입력값을 다시 확인해주세요." },
};

// error.code가 없거나 목록에 없을 때, 원문 메시지로 한 번 더 추정
const translateByMessage = (message: string): Mapped => {
  if (/password/i.test(message) && /(least|short|weak|characters)/i.test(message)) {
    return {
      message: "비밀번호가 너무 짧아요. 6자 이상 입력해주세요.",
      field: "password",
    };
  }
  if (/already registered|already exists/i.test(message)) {
    return { message: "이미 가입된 이메일이에요.", field: "email" };
  }
  if (/invalid login credentials/i.test(message)) {
    return {
      message: "이메일 또는 비밀번호가 올바르지 않아요.",
      field: "password",
    };
  }
  if (/invalid email/i.test(message)) {
    return { message: "올바른 이메일 형식이 아니에요.", field: "email" };
  }
  return { message: "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요." };
};

export const translateAuthError = (error: AuthError): Mapped => {
  const known = error.code ? AUTH_ERROR_MESSAGES[error.code] : undefined;
  return known ?? translateByMessage(error.message);
};
