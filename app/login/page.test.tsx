import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

// vi.mock factory는 import보다 먼저 끌어올려지므로(hoisted), factory가 참조하는
// mock 함수들은 vi.hoisted로 같은 위치에 선언해야 한다.
const { signUp, signOut, signInWithPassword, signInWithOAuth, push } = vi.hoisted(
  () => ({
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    push: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp, signOut, signInWithPassword, signInWithOAuth },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function switchToSignup() {
  return userEvent.click(
    screen.getByRole("button", { name: "계정이 없으신가요? 회원가입" }),
  );
}

describe("LoginPage - 이메일 형식 검증 및 회원가입 흐름", () => {
  beforeEach(() => {
    signUp.mockReset();
    signOut.mockReset();
    signInWithPassword.mockReset();
    push.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("회원가입 시 이메일 형식이 틀리면 인풋 에러를 보여주고 signUp을 호출하지 않는다", async () => {
    render(<LoginPage />);
    await switchToSignup();

    await userEvent.type(screen.getByPlaceholderText("이메일"), "asdf@asdf");
    await userEvent.type(screen.getByPlaceholderText("비밀번호"), "password123");
    await userEvent.type(
      screen.getByPlaceholderText("비밀번호 확인"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: "회원가입" }));

    expect(
      await screen.findByText("올바른 이메일 형식이 아니에요."),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("로그인 시에도 이메일 형식이 틀리면 인풋 에러를 보여준다", async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("이메일"), "asdf@asdf");
    await userEvent.type(screen.getByPlaceholderText("비밀번호"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("올바른 이메일 형식이 아니에요."),
    ).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("회원가입이 바로 세션을 돌려줘도 자동 로그인시키지 않고 로그인 화면으로 돌아간다", async () => {
    signUp.mockResolvedValue({
      data: { session: { access_token: "fake" }, user: null },
      error: null,
    });
    signOut.mockResolvedValue({ error: null });

    render(<LoginPage />);
    await switchToSignup();

    await userEvent.type(screen.getByPlaceholderText("이메일"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("비밀번호"), "password123");
    await userEvent.type(
      screen.getByPlaceholderText("비밀번호 확인"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: "회원가입" }));

    // 세션이 있었다면 바로 로그아웃시켜서 자동 로그인을 무효화해야 한다.
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    // /home으로 바로 보내면 안 된다 - 다시 로그인하게 해야 한다.
    expect(push).not.toHaveBeenCalledWith("/home");
    // 로그인 화면(버튼 라벨이 "로그인")으로 돌아와야 한다.
    expect(
      await screen.findByRole("button", { name: "로그인" }),
    ).toBeInTheDocument();
  });

  it("이메일 확인이 필요해 세션이 없으면 로그아웃 없이 로그인 화면으로 전환한다", async () => {
    signUp.mockResolvedValue({ data: { session: null, user: null }, error: null });

    render(<LoginPage />);
    await switchToSignup();

    await userEvent.type(screen.getByPlaceholderText("이메일"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("비밀번호"), "password123");
    await userEvent.type(
      screen.getByPlaceholderText("비밀번호 확인"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: "회원가입" }));

    expect(
      await screen.findByRole("button", { name: "로그인" }),
    ).toBeInTheDocument();
    expect(signOut).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalledWith("/home");
  });
});
