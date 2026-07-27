/** The verified checkmark. Uses --verified so it follows the token system. */
export default function Check({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M1 6.2 4.3 9.5 11 2.8"
        stroke="var(--verified)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
