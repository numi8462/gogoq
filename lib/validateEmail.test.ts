import { describe, expect, it } from "vitest";
import { isValidEmail } from "./validateEmail";

describe("isValidEmail", () => {
  it("정상적인 이메일 형식은 통과시킨다", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name+tag@sub.example.co.kr")).toBe(true);
  });

  it("도메인에 점(TLD)이 없으면 거부한다 - '골뱅이만 붙인' 케이스", () => {
    expect(isValidEmail("asdf@asdf")).toBe(false);
    expect(isValidEmail("asdf@")).toBe(false);
  });

  it("@가 없거나 로컬파트/도메인이 비어있으면 거부한다", () => {
    expect(isValidEmail("asdf.com")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("asdf@.com")).toBe(false);
  });

  it("공백이 포함되면 거부한다", () => {
    expect(isValidEmail("a b@example.com")).toBe(false);
    expect(isValidEmail("ab@exa mple.com")).toBe(false);
  });

  it("앞뒤 공백은 trim 후 검사한다", () => {
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });

  it("빈 문자열은 거부한다", () => {
    expect(isValidEmail("")).toBe(false);
  });
});
