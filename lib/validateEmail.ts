// 실용적인 이메일 형식 검사. RFC 5322 전체를 따르진 않지만,
// "로컬파트@도메인.TLD" 구조(점이 있는 도메인)를 요구해서
// "asdf@"나 "asdf@asdf"처럼 도메인에 점이 없는 값은 걸러낸다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}
