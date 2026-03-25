/**
 * components/common/CompareIcon.tsx
 * 비교하기 전용 SVG 아이콘 컴포넌트
 * - 화장품 병 2개를 나란히 배치한 심플 아이콘
 * - size / color / className props로 커스터마이즈 가능
 */

interface CompareIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function CompareIcon({
  size = 20,
  color = "currentColor",
  className = "",
}: CompareIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="비교하기"
    >
      {/* 왼쪽 병 몸통 */}
      <rect
        x="1.5"
        y="8.5"
        width="6"
        height="8"
        rx="1.5"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* 왼쪽 병 넥 */}
      <path
        d="M3 8.5V7.2C3 6.8 3.4 6.2 4.5 5.8H4.5"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6 8.5V7.2C6 6.8 5.6 6.2 4.5 5.8"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* 왼쪽 병 뚜껑 */}
      <rect
        x="3.5"
        y="4"
        width="2"
        height="1.8"
        rx="0.5"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 오른쪽 병 몸통 */}
      <rect
        x="12.5"
        y="8.5"
        width="6"
        height="8"
        rx="1.5"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* 오른쪽 병 넥 */}
      <path
        d="M14 8.5V7.2C14 6.8 14.4 6.2 15.5 5.8"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M17 8.5V7.2C17 6.8 16.6 6.2 15.5 5.8"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* 오른쪽 병 뚜껑 */}
      <rect
        x="14.5"
        y="4"
        width="2"
        height="1.8"
        rx="0.5"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 가운데 비교 구분선 */}
      <line
        x1="10"
        y1="6"
        x2="10"
        y2="17"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="1.5 1.5"
        opacity="0.5"
      />
    </svg>
  );
}
