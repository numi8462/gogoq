/** 보드 위의 말 모양. 색은 currentColor를 따른다. */
export default function PawnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 27" aria-hidden className={className}>
      <circle cx="11" cy="6" r="5" fill="currentColor" />
      <path
        d="M7.5 11.5h7l-1 2.2c1.6 2.2 2.6 4.6 3.3 7.3H5.2c.7-2.7 1.7-5.1 3.3-7.3z"
        fill="currentColor"
      />
      <rect x="2.5" y="20.5" width="17" height="5.5" rx="2.75" fill="currentColor" />
      <circle cx="9.3" cy="4.4" r="1.6" fill="white" opacity="0.45" />
    </svg>
  );
}
