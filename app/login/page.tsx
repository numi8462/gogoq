"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/Logo";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import KakaoIcon from "@/components/common/KakaoIcon";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/useToastStore";
import { translateAuthError } from "@/lib/authErrors";
import type { AuthError } from "@supabase/supabase-js";

type Mode = "signin" | "signup";
type FieldErrors = { email?: string; password?: string; confirmPassword?: string };

export default function LoginPage() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // 에러가 특정 입력(이메일/비밀번호)에 해당하면 그 필드 밑에, 아니면 폼 하단에 표시
  const applyAuthError = (authError: AuthError) => {
    const { message, field } = translateAuthError(authError);
    if (field) {
      setFieldErrors((f) => ({ ...f, [field]: message }));
    } else {
      setError(message);
    }
  };

  const validate = () => {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "이메일을 입력해주세요.";
    if (!password.trim()) errors.password = "비밀번호를 입력해주세요.";
    if (mode === "signup") {
      if (!confirmPassword.trim()) {
        errors.confirmPassword = "비밀번호를 다시 입력해주세요.";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "비밀번호가 일치하지 않아요.";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setIsLoading(false);
      if (error) return applyAuthError(error);

      // 이메일 확인이 켜져 있으면 세션 없이 가입만 됨 → 로그인 화면으로 전환
      if (!data.session) {
        showToast("가입 확인 이메일을 보냈어요. 메일함을 확인해주세요.");
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        return;
      }
      showToast("회원가입됐어요!");
      router.push("/home");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsLoading(false);
    if (error) return applyAuthError(error);
    showToast("로그인됐어요!");
    router.push("/home");
  };

  const handleKakao = async () => {
    setError(null);
    const supabase = createClient();
    // account_email 요청 여부는 Supabase Kakao Provider의
    // "Allow users without an email" 설정에서 제어한다 (scopes 옵션으로는 못 뺌).
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) applyAuthError(error);
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="relative w-full max-w-md flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-6 mb-2">
          <Logo size="md" />
          <h1 className="text-xl font-bold text-text-primary">
            {mode === "signin" ? "로그인" : "회원가입"}
          </h1>
        </div>

        <div className="rounded-2xl p-5 flex flex-col gap-3 bg-surface/50 border border-(--border)">
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
            }}
            placeholder="이메일"
            autoComplete="email"
            error={fieldErrors.email}
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            onKeyDown={(e) => mode === "signin" && e.key === "Enter" && handleSubmit()}
            placeholder="비밀번호"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            error={fieldErrors.password}
          />
          {mode === "signup" && (
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((f) => ({ ...f, confirmPassword: undefined }));
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="비밀번호 확인"
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
            />
          )}
          <Button onClick={handleSubmit} isLoading={isLoading} className="w-full">
            {mode === "signin" ? "로그인" : "회원가입"}
          </Button>
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setConfirmPassword("");
              setError(null);
              setFieldErrors({});
            }}
            className="text-xs text-text-secondary hover:text-text-primary transition text-center"
          >
            {mode === "signin"
              ? "계정이 없으신가요? 회원가입"
              : "이미 계정이 있으신가요? 로그인"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-(--border)" />
          <span className="text-xs text-text-secondary">또는</span>
          <hr className="flex-1 border-(--border)" />
        </div>

        <Button
          variant="secondary"
          onClick={handleKakao}
          className="w-full flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] border-0"
        >
          <KakaoIcon className="h-4 w-4" />
          카카오로 계속하기
        </Button>

        <button
          onClick={() => router.push("/home")}
          className="text-xs text-text-secondary hover:text-text-primary transition text-center"
        >
          로그인 없이 게스트로 계속하기
        </button>

        {error && <p className="text-xs text-danger text-center">{error}</p>}
      </div>
    </main>
  );
}
