"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const CAMERA_Z_INDEX = { zIndex: 1 };
const DARK_BG_STYLE = {
  background:
    "radial-gradient(ellipse 80% 60% at 50% 45%, #2a2a2a 0%, #111 50%, #000 100%)",
};
const VIGNETTE_STYLE = {
  background:
    "radial-gradient(ellipse 80% 60% at 50% 42%, transparent 50%, rgba(0,0,0,0.5) 100%)",
};
const TOP_GRAD_STYLE = {
  background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
};
const ICON_BTN_STYLE = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  backgroundColor: "rgba(0,0,0,0.3)",
  backdropFilter: "blur(8px)",
};
const TITLE_TEXT_STYLE = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#fff",
  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
};
const SPACER_40 = { width: 40 };
const HINT_BOX_STYLE = {
  borderRadius: "20px",
  backgroundColor: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(12px)",
};
const HINT_TEXT_STYLE = {
  fontSize: "13px",
  color: "#fff",
  fontWeight: 500,
  textAlign: "center" as const,
  margin: 0,
};
const HINT_BOX_DARK = {
  borderRadius: "20px",
  backgroundColor: "rgba(0,0,0,0.5)",
  backdropFilter: "blur(12px)",
};
const BOTTOM_GRAD_STYLE = {
  background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
};
const BOTTOM_BAR_STYLE = {
  backgroundColor: "rgba(0,0,0,0.75)",
  paddingBottom: "max(env(safe-area-inset-bottom, 12px), 12px)",
};
const SIDE_BTN_STYLE = {
  width: 48,
  height: 48,
  borderRadius: "14px",
  backgroundColor: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(8px)",
};
const SHUTTER_OUTER_STYLE = {
  width: 76,
  height: 76,
  borderRadius: "50%",
  backgroundColor: "transparent",
  border: "4px solid rgba(255,255,255,0.8)",
  padding: 4,
};
const SHUTTER_INNER_STYLE = {
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #F5809D, #e8607e)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const HINT_BOTTOM_TEXT = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.5)",
  fontWeight: 500,
};
const UPLOAD_BTN_STYLE = {
  height: 44,
  borderRadius: "12px",
  backgroundColor: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(8px)",
  color: "#fff",
  fontSize: "13px",
  fontWeight: 600,
  border: "1px solid rgba(255,255,255,0.2)",
};
const RETRY_BTN_STYLE = {
  height: 44,
  borderRadius: "12px",
  backgroundColor: "rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.55)",
  fontSize: "13px",
  fontWeight: 500,
};

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, SwitchCamera, ImagePlus } from "lucide-react";

/* ── 얼굴 가이드 SVG 오버레이 ── */
function FaceOverlay({ scanning }: { scanning: boolean }) {
  return (
    <svg
      viewBox="0 0 393 600"
      fill="none"
      className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 얼굴 타원 */}
      <ellipse
        cx="196"
        cy="270"
        rx="120"
        ry="168"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="8 6"
        strokeOpacity="0.75"
        fill="none"
      >
        {scanning && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="28"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </ellipse>
      {/* 왼눈 */}
      <path
        d="M135,250 Q160,228 185,250"
        stroke="white"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        strokeOpacity="0.6"
        fill="none"
      />
      {/* 오른눈 */}
      <path
        d="M210,250 Q235,228 260,250"
        stroke="white"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        strokeOpacity="0.6"
        fill="none"
      />
      {/* 왼쪽 눈 아래 */}
      <path
        d="M140,275 Q163,295 185,275"
        stroke="white"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        strokeOpacity="0.5"
        fill="none"
      />
      {/* 오른쪽 눈 아래 */}
      <path
        d="M210,275 Q233,295 255,275"
        stroke="white"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        strokeOpacity="0.5"
        fill="none"
      />
      {/* 코 */}
      <path
        d="M196,260 L196,310"
        stroke="white"
        strokeWidth="1"
        strokeDasharray="4 3"
        strokeOpacity="0.3"
        fill="none"
      />
      {/* 입 */}
      <path
        d="M170,340 Q196,358 222,340"
        stroke="white"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        strokeOpacity="0.4"
        fill="none"
      />
    </svg>
  );
}

/* ── 스캔 펄스 링 ── */
function ScanPulse() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[4]">
      {[0, 0.8, 1.6].map((delay, i) => (
        <div
          key={i}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: "42%",
            width: "280px",
            height: "380px",
            borderRadius: "50%",
            border: "1.5px solid rgba(245,128,157,0.3)",
            animation: `scanPulse 2.4s ${delay}s ease-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes scanPulse {
          0%   { transform: translateX(-50%) scale(0.85); opacity: 0.6; }
          100% { transform: translateX(-50%) scale(1.2);  opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function PhotoAnalysisPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [scanning, setScanning] = useState(true);
  const [flash, setFlash] = useState(false);

  /* ── 카메라 시작 ── */
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setCameraError(false);
    } catch {
      setCameraError(true);
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const switchCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  /* ── 사진 촬영 ── */
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    setPreview(canvas.toDataURL("image/jpeg", 0.9));
    setScanning(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  /* ── 파일 업로드 ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setScanning(false);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraActive(false);
    };
    reader.readAsDataURL(file);
  };

  /* ── 다시 촬영 ── */
  const retake = () => {
    setPreview(null);
    setScanning(true);
    startCamera(facingMode);
  };

  const handleShutterClick = () => {
    if (cameraActive) capturePhoto();
    else if (cameraError) fileRef.current?.click();
  };

  /* ── AI 분석 시작 → skin-test/select로 이동 (TODO: 실제 AI 분석 연동) ── */
  const handleAnalysisStart = () => {
    router.push("/mypage");
  };

  return (
    <div
      className="absolute inset-0 flex flex-col bg-black overflow-hidden"
      style={CAMERA_Z_INDEX}
    >
      {/* 숨김 헬퍼 */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── 카메라 / 프리뷰 영역 ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* 카메라 피드 */}
        {!preview && !cameraError && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />
        )}

        {/* 프리뷰 이미지 */}
        {preview && (
          <img
            src={preview}
            alt="Captured"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* 카메라 오류: 뷰파인더 플레이스홀더 */}
        {cameraError && !preview && (
          <div className="absolute inset-0" style={DARK_BG_STYLE} />
        )}

        {/* 비네팅 */}
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={VIGNETTE_STYLE}
        />

        {/* 얼굴 오버레이 */}
        <FaceOverlay scanning={scanning && (cameraActive || cameraError)} />

        {/* 스캔 펄스 */}
        {scanning && !preview && <ScanPulse />}

        {/* 플래시 효과 */}
        {flash && (
          <div
            className="absolute inset-0 bg-white z-30 pointer-events-none"
            style={{ animation: "flashFade 0.15s ease forwards" }}
          />
        )}

        {/* 상단 그라디언트 */}
        <div
          className="absolute top-0 left-0 right-0 h-28 pointer-events-none z-[6]"
          style={TOP_GRAD_STYLE}
        />

        {/* ── 상단 바 ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-2 z-[10]">
          <button
            onClick={() => router.push("/skin-test")}
            className="flex items-center justify-center border-none cursor-pointer"
            style={ICON_BTN_STYLE}
          >
            <ArrowLeft size={20} color="#fff" />
          </button>

          <span style={TITLE_TEXT_STYLE}>AI 피부 분석</span>

          {!preview ? (
            <button
              onClick={switchCamera}
              className="flex items-center justify-center border-none cursor-pointer"
              style={ICON_BTN_STYLE}
            >
              <SwitchCamera size={18} color="#fff" />
            </button>
          ) : (
            <div style={SPACER_40} />
          )}
        </div>

        {/* ── 가이드 텍스트 ── */}
        {!preview && (
          <div className="absolute top-[72px] left-0 right-0 flex justify-center z-[10]">
            <div className="px-5 py-2.5" style={HINT_BOX_STYLE}>
              <p style={HINT_TEXT_STYLE}>
                {cameraError
                  ? "사진을 업로드하거나 촬영 버튼을 눌러주세요"
                  : "얼굴을 가이드 안에 맞춰주세요"}
              </p>
            </div>
          </div>
        )}

        {/* ── 촬영 완료 안내 ── */}
        {preview && (
          <div className="absolute top-[72px] left-0 right-0 flex justify-center z-[10]">
            <div className="px-5 py-2.5" style={HINT_BOX_DARK}>
              <p style={HINT_TEXT_STYLE}>✨ 사진이 준비되었어요!</p>
            </div>
          </div>
        )}

        {/* 하단 그라디언트 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none z-[6]"
          style={BOTTOM_GRAD_STYLE}
        />
      </div>

      {/* ── 하단 컨트롤 ── */}
      <div className="shrink-0 relative z-[10]" style={BOTTOM_BAR_STYLE}>
        {!preview ? (
          <div className="flex flex-col items-center pt-5 pb-3 gap-4">
            {/* 촬영 버튼 행 */}
            <div className="flex items-center justify-center gap-12">
              {/* 갤러리 */}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center cursor-pointer border-none"
                style={SIDE_BTN_STYLE}
              >
                <ImagePlus size={22} color="#fff" />
              </button>

              {/* 셔터 */}
              <button
                onClick={handleShutterClick}
                className="cursor-pointer border-none transition-all active:scale-90"
                style={SHUTTER_OUTER_STYLE}
              >
                <div style={SHUTTER_INNER_STYLE}>
                  <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
                    <path
                      d="M2 8V4C2 2.89543 2.89543 2 4 2H8M18 2H22C23.1046 2 24 2.89543 24 4V8M24 18V22C24 23.1046 23.1046 24 22 24H18M8 24H4C2.89543 24 2 23.1046 2 22V18"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <circle cx="9.5" cy="10" r="1.2" fill="white" />
                    <circle cx="16.5" cy="10" r="1.2" fill="white" />
                    <path
                      d="M9 16.5C9 16.5 10.5 18.5 13 18.5C15.5 18.5 17 16.5 17 16.5"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </button>

              {/* 카메라 전환 */}
              <button
                onClick={switchCamera}
                className="flex items-center justify-center cursor-pointer border-none"
                style={SIDE_BTN_STYLE}
              >
                <SwitchCamera size={22} color="#fff" />
              </button>
            </div>

            {/* 건너뛰기 */}
            <button
              onClick={() => router.push("/mypage")}
              className="bg-transparent border-none cursor-pointer"
              style={HINT_BOTTOM_TEXT}
            >
              건너뛰기
            </button>
          </div>
        ) : (
          /* 프리뷰 모드 */
          <div className="flex flex-col items-center pt-5 pb-3 gap-3 px-6">
            <button
              onClick={handleAnalysisStart}
              className="w-full transition-all active:scale-[0.97] cursor-pointer border-none"
              style={{
                height: 52,
                borderRadius: "16px",
                background: "linear-gradient(135deg, #A2AA7B, #8a9468)",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(162,170,123,0.4)",
              }}
            >
              🤖 AI 분석 시작하기
            </button>
            <div className="flex gap-3 w-full">
              <button
                onClick={retake}
                className="flex-1 transition-all active:scale-[0.97] cursor-pointer border-none"
                style={UPLOAD_BTN_STYLE}
              >
                다시 촬영
              </button>
              <button
                onClick={() => router.push("/mypage")}
                className="flex-1 transition-all active:scale-[0.97] cursor-pointer border-none"
                style={RETRY_BTN_STYLE}
              >
                건너뛰기
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes flashFade { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
    </div>
  );
}
