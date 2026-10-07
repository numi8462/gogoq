import { describe, expect, it } from "vitest";
import { AuthError } from "@supabase/supabase-js";
import { translateAuthError } from "./authErrors";

describe("translateAuthError", () => {
  it("알려진 error.code는 매핑 테이블 그대로 한글 메시지+필드로 변환한다", () => {
    const error = new AuthError("Password should be at least 6 characters", 422, "weak_password");
    const result = translateAuthError(error);
    expect(result).toEqual({
      message: "비밀번호가 너무 짧아요. 6자 이상 입력해주세요.",
      field: "password",
    });
  });

  it("field가 없는 code(예: email_not_confirmed)는 field 없이 message만 반환한다", () => {
    const error = new AuthError("Email not confirmed", 400, "email_not_confirmed");
    const result = translateAuthError(error);
    expect(result.field).toBeUndefined();
    expect(result.message).toBe("이메일 인증이 필요해요. 메일함을 확인해주세요.");
  });

  it("code가 목록에 없으면 원문 메시지를 보고 추정한다 (invalid login credentials)", () => {
    const error = new AuthError("Invalid login credentials", 400, "some_unmapped_code");
    const result = translateAuthError(error);
    expect(result).toEqual({
      message: "이메일 또는 비밀번호가 올바르지 않아요.",
      field: "password",
    });
  });

  it("code 자체가 없는 에러도 메시지 추정 fallback으로 처리한다", () => {
    const error = new AuthError("User already registered", 400);
    const result = translateAuthError(error);
    expect(result).toEqual({
      message: "이미 가입된 이메일이에요.",
      field: "email",
    });
  });

  it("알 수 없는 code와 알 수 없는 메시지는 범용 에러 메시지로 떨어진다", () => {
    const error = new AuthError("Something totally unexpected happened", 500, "mystery_code");
    const result = translateAuthError(error);
    expect(result.field).toBeUndefined();
    expect(result.message).toBe("요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.");
  });
});
