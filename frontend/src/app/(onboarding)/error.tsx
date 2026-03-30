'use client';

import { useEffect } from 'react';

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 px-6">
      <p className="text-[14px] text-[#a69d92] text-center">
        오류가 발생했어요.
        <br />
        잠시 후 다시 시도해 주세요.
      </p>
      <button
        onClick={reset}
        className="text-sm text-[#635446] underline underline-offset-2"
      >
        다시 시도
      </button>
    </div>
  );
}
