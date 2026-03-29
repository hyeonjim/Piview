"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, SwitchCamera, ImagePlus } from "lucide-react";
import { useCaptureAnalysis, useAnalysisStatus } from "@/hooks";
import { useSurveyStore } from "@/stores";

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
  fontSize: "22px",
  fontWeight: 600,
  color: "#fff",
  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
};
const HINT_BOX_STYLE = {
  borderRadius: "20px",
  backgroundColor: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(12px)",
};
const HINT_TEXT_STYLE = {
  fontSize: "18px",
  color: "#fff",
  fontWeight: 600,
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
export default function PhotoAnalysisPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const [flash, setFlash] = useState(false);

  const { mutate: capture, isPending: isCapturing } = useCaptureAnalysis();
  const setAnalysisId = useSurveyStore((s) => s.setAnalysisId);
  const analysisId = useSurveyStore((s) => s.analysisId);
  const { data: analysisStatus } = useAnalysisStatus(analysisId);

  const isAnalyzing = isCapturing || analysisStatus?.status === "PENDING";

  /* ── 카메라 시작 ── */
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    // 기존 스트림 정리 (동기)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // setState는 await 이후에 호출해 useEffect 내 동기 setState 경고 방지
    await Promise.resolve();
    setCameraLoading(true);

    try {
      let stream: MediaStream;
      try {
        // 4:3 비율 (세로 기준 3:4) 요청
        stream = await navigator.mediaDevices.getUserMedia({
          video:
            facing === "user"
              ? {
                  facingMode: { exact: "user" },
                  width: { ideal: 960 },
                  height: { ideal: 1280 },
                }
              : {
                  facingMode: { exact: "environment" },
                  width: { ideal: 1080 },
                  height: { ideal: 1440 },
                },
          audio: false,
        });
      } catch {
        // exact 실패(일부 기기) → facingMode 문자열 폴백
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
      }

      streamRef.current = stream;

      // 전면 카메라: zoom 최솟값 강제 — 브라우저 기본 줌인 보정
      if (facing === "user") {
        const track = stream.getVideoTracks()[0];
        try {
          const caps = track?.getCapabilities?.() as MediaTrackCapabilities & {
            zoom?: { min: number; max: number };
          };
          if (caps?.zoom) {
            await track.applyConstraints({
              advanced: [{ zoom: caps.zoom.min } as MediaTrackConstraintSet],
            });
          }
        } catch {
          /* zoom 미지원 기기 무시 */
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {}
      }
      setCameraActive(true);
      setCameraError(false);
      setCameraLoading(false);
    } catch {
      setCameraError(true);
      setCameraActive(false);
      setCameraLoading(false);
    }
  }, []);

  // videoRef 마운트 후 stream이 이미 있으면 연결 (타이밍 엇갈린 경우 보정)
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  useEffect(() => {
    // 마운트 시 1회만 실행 — startCamera 내 setState는 await 이후 실행되므로 false positive
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []); // intentional mount-only

  // 권한 허용 후 탭으로 돌아올 때 카메라 재시도
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !cameraActive && !preview) {
        startCamera(facingMode);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [cameraActive, preview, facingMode]);

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
    // canvas → File 변환
    canvas.toBlob(
      (blob) => {
        if (blob)
          setCapturedFile(
            new File([blob], "capture.jpg", { type: "image/jpeg" }),
          );
      },
      "image/jpeg",
      0.9,
    );
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  /* ── 파일 업로드 ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraActive(false);
    };
    reader.readAsDataURL(file);
  };

  /* ── 다시 촬영 ── */
  const retake = () => {
    setPreview(null);
    setCapturedFile(null);
    startCamera(facingMode);
  };

  const handleShutterClick = () => {
    if (cameraLoading) return;
    if (cameraActive) capturePhoto();
    else if (cameraError) fileRef.current?.click();
  };

  /* ── COMPLETED 감지 → survey 페이지 이동 ── */
  useEffect(() => {
    if (analysisStatus?.status === "COMPLETED") {
      router.push("/skin-test/survey/1");
    }
    if (analysisStatus?.status === "FAILED") {
      // AI 분석 실패 → analysisId 초기화 후 재촬영 유도
      setAnalysisId("");
      alert(
        analysisStatus.errorMessage ?? "분석에 실패했어요. 다시 촬영해주세요.",
      );
    }
  }, [analysisStatus?.status]);

  /* ── AI 분석 시작 ── */
  const handleAnalysisStart = () => {
    if (!capturedFile || isAnalyzing) return;
    capture(capturedFile, {
      onSuccess: ({ analysisId: id }) => {
        setAnalysisId(id);
      },
      onError: () => {
        router.push("/skin-test/survey/1");
      },
    });
  };

  return (
    <div
      className="absolute inset-0 bg-black overflow-hidden"
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

      {/* ── 카메라 / 프리뷰 영역 (전체화면) ── */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">

        {/* 4:3 뷰파인더 컨테이너 (세로 기준 width:height = 3:4) */}
        <div
          className="relative overflow-hidden w-full"
          style={{ aspectRatio: "3/4" }}
        >
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

          {/* 프리뷰 이미지 (base64 data URL → unoptimized + fill) */}
          {preview && (
            <Image
              src={preview}
              alt="Captured"
              fill
              unoptimized
              className="object-cover"
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

          {/* 하단 그라디언트 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none z-[6]"
            style={BOTTOM_GRAD_STYLE}
          />
        </div>

        {/* ── 상단 바 (전체화면 기준 오버레이) ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-2 z-[10]">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center border-none cursor-pointer"
            style={ICON_BTN_STYLE}
          >
            <ArrowLeft size={20} color="#fff" />
          </button>
          <span style={TITLE_TEXT_STYLE}>AI 피부 분석</span>
        </div>

        {/* ── 가이드 텍스트 ── */}
        {!preview && (
          <div className="absolute left-0 right-0 top-15 flex justify-center">
            <div className="px-5 py-2.5 "  style={HINT_BOX_STYLE}>
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
      </div>

      {/* ── 하단 컨트롤 (카메라 위 오버레이) ── */}
      <div className="absolute bottom-0 left-0 right-0 z-[10]" style={BOTTOM_BAR_STYLE}>
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
                <div style={SHUTTER_INNER_STYLE} />
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

            {/* 건너뛰기 버튼 제거 — 사진 없이 설문 제출 불가 */}
          </div>
        ) : (
          /* 프리뷰 모드 */
          <div className="flex flex-col items-center pt-5 pb-3 gap-3 px-6">
            <button
              onClick={handleAnalysisStart}
              disabled={isAnalyzing}
              className="w-full transition-all active:scale-[0.97] cursor-pointer border-none"
              style={{
                height: 52,
                borderRadius: "16px",
                background: isAnalyzing
                  ? "rgba(162,170,123,0.5)"
                  : "linear-gradient(135deg, #A2AA7B, #8a9468)",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 600,
                boxShadow: isAnalyzing
                  ? "none"
                  : "0 4px 16px rgba(162,170,123,0.4)",
                cursor: isAnalyzing ? "default" : "pointer",
              }}
            >
              {isAnalyzing ? "🔍 분석 중..." : "🤖 AI 분석 시작하기"}
            </button>
            <div className="flex gap-3 w-full">
              <button
                onClick={retake}
                className="flex-1 transition-all active:scale-[0.97] cursor-pointer border-none"
                style={UPLOAD_BTN_STYLE}
              >
                다시 촬영
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
