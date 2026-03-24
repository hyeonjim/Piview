"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X, Camera, Upload, SwitchCamera, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { useOcr, useProductDetail } from "@/hooks";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import ProductCard from "@/components/common/ProductCard";

interface OcrModalProps {
  onClose: () => void;
}

export default function OcrModal({ onClose }: OcrModalProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<"select" | "camera" | "result">("select");
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [cameraError, setCameraError] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  const [recognizedProductId, setRecognizedProductId] = useState<number | null>(
    null,
  );
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);

  const { mutate: recognize, isPending: isRecognizing } = useOcr();
  const { data: product, isLoading: isLoadingProduct } =
    useProductDetail(recognizedProductId);

  const isLoading = isRecognizing || isLoadingProduct;

  // 카메라 시작
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    setCameraLoading(true);
    setCameraError(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraLoading(false);
    } catch {
      setCameraError(true);
      setCameraLoading(false);
    }
  }, []);

  // 카메라 모드 진입
  const openCamera = () => {
    setMode("camera");
  };

  useEffect(() => {
    if (mode === "camera") {
      startCamera(facingMode);
    }
    return () => {
      if (mode !== "camera") {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [mode]);

  // 카메라 종료
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // 전후면 전환
  const switchCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  // 촬영
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        const file = new File([blob], "ocr_capture.jpg", {
          type: "image/jpeg",
        });
        handleFile(file);
      },
      "image/jpeg",
      0.9,
    );
  };

  const handleFile = (file: File) => {
    setMode("result");
    setOcrDone(false);
    setOcrFailed(false);
    setRecognizedProductId(null);

    recognize(file, {
      onSuccess: (result) => {
        setOcrDone(true);
        if (result.success && result.productId) {
          setRecognizedProductId(result.productId);
        } else {
          setOcrFailed(true);
        }
      },
      onError: () => {
        setOcrDone(true);
        setOcrFailed(true);
      },
    });
  };

  const handleAddProduct = () => {
    if (!product) return;
    toast(`✓ ${product.productName} 루틴에 추가됨!`);
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleRetry = () => {
    setMode("select");
    setOcrDone(false);
    setOcrFailed(false);
    setRecognizedProductId(null);
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
        onClick={isLoading ? undefined : handleClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none py-10 px-5">
        <div
          className="pointer-events-auto w-full bg-white rounded-2xl flex flex-col overflow-hidden"
          style={{ maxWidth: "420px", maxHeight: "85vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDEBE8] shrink-0">
            <h2 className="text-base font-bold text-[#2A2118]">
              {mode === "camera" ? "카메라 촬영" : "OCR 제품 인식"}
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className={`w-8 h-8 flex items-center justify-center rounded-full bg-[#F2EFE9] border-none ${isLoading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <X size={14} className="text-[#8A8278]" />
            </button>
          </div>

          {/* 바디 */}
          <div className="flex-1 overflow-y-auto">
            {/* ── 선택 화면 ── */}
            {mode === "select" && (
              <div className="px-5 py-5">
                <p className="text-xs text-[#A69D92] mb-4 text-center">
                  화장품 라벨을 촬영하거나 이미지를 업로드하세요
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={openCamera}
                    className="flex-1 flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-[#D9D5D0] bg-[#F9F7F4] text-[#8A8278] font-semibold text-sm cursor-pointer transition-all hover:border-brand hover:text-brand"
                  >
                    <Camera size={22} />
                    카메라 촬영
                  </button>
                  <button
                    onClick={() => uploadInputRef.current?.click()}
                    className="flex-1 flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-[#D9D5D0] bg-[#F9F7F4] text-[#8A8278] font-semibold text-sm cursor-pointer transition-all hover:border-brand hover:text-brand"
                  >
                    <Upload size={22} />
                    이미지 업로드
                  </button>
                </div>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>
            )}

            {/* ── 카메라 뷰파인더 ── */}
            {mode === "camera" && (
              <div className="relative bg-black" style={{ aspectRatio: "3/4" }}>
                <canvas ref={canvasRef} className="hidden" />

                {cameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                    카메라 불러오는 중...
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white px-6 text-center">
                    <Camera size={32} className="opacity-50" />
                    <p className="text-sm">카메라를 열 수 없어요</p>
                    <p className="text-xs opacity-70">
                      브라우저 카메라 권한을 확인해주세요
                    </p>
                    <button
                      onClick={() => uploadInputRef.current?.click()}
                      className="mt-2 px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-semibold"
                    >
                      이미지 업로드로 대체
                    </button>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setMode("select");
                          handleFile(f);
                        }
                      }}
                    />
                  </div>
                )}

                {/* 비디오 */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* 촬영 가이드 */}
                {!cameraLoading && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div
                      className="border-2 border-white/70 rounded-xl"
                      style={{ width: "70%", aspectRatio: "3/2" }}
                    />
                    <p className="text-white text-xs mt-3 opacity-80">
                      화장품 라벨을 가이드 안에 맞춰주세요
                    </p>
                  </div>
                )}

                {/* 하단 컨트롤 */}
                {!cameraLoading && !cameraError && (
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-5 bg-gradient-to-t from-black/60 to-transparent">
                    {/* 뒤로 */}
                    <button
                      onClick={() => {
                        stopCamera();
                        setMode("select");
                      }}
                      className="text-white text-xs font-semibold opacity-80"
                    >
                      취소
                    </button>

                    {/* 촬영 버튼 */}
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white border-4 border-white/50 flex items-center justify-center cursor-pointer"
                      style={{ boxShadow: "0 0 0 3px rgba(255,255,255,0.3)" }}
                    >
                      <div className="w-12 h-12 rounded-full bg-white" />
                    </button>

                    {/* 전후면 전환 */}
                    <button
                      onClick={switchCamera}
                      className="text-white opacity-80"
                    >
                      <SwitchCamera size={22} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── 결과 화면 ── */}
            {mode === "result" && (
              <div className="px-5 py-5">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#A69D92]">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">
                      {isRecognizing
                        ? "이미지 인식 중..."
                        : "제품 정보 불러오는 중..."}
                    </p>
                  </div>
                )}

                {ocrFailed && !isLoading && (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <ZoomIn size={32} className="text-[#BFB6AA]" />
                    <p className="text-sm text-[#A69D92]">
                      제품을 인식하지 못했어요
                    </p>
                    <p className="text-xs text-[#BFB6AA]">
                      다시 촬영하거나 다른 이미지를 업로드해보세요
                    </p>
                    <button
                      onClick={handleRetry}
                      className="mt-3 px-5 py-2 rounded-lg bg-brand text-white text-sm font-semibold"
                    >
                      다시 시도
                    </button>
                  </div>
                )}

                {ocrDone && !ocrFailed && !isLoading && product && (
                  <div>
                    <p className="text-xs text-[#A69D92] mb-3">
                      인식된 제품이에요. 루틴에 추가하시겠어요?
                    </p>
                    <ProductCard
                      id={product.productId}
                      brand={product.brandName ?? ""}
                      name={product.productName ?? ""}
                      category={product.categoryName ?? ""}
                      imageUrl={product.imageUrl ?? undefined}
                      skinTypes={(product.skinTypes ?? []).map(
                        fromSkinTypeEnum,
                      )}
                      effects={product.tags ?? []}
                      variant="modal"
                      showActions={true}
                      showLike={false}
                      onAddRoutine={handleAddProduct}
                    />
                    <button
                      onClick={handleRetry}
                      className="mt-3 w-full py-2 rounded-lg border border-[#D9D5D0] text-[#8A8278] text-sm font-semibold"
                    >
                      다시 촬영
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
