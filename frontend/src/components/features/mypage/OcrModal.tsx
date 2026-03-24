"use client";

import { useRef, useState } from "react";
import { X, Camera, Upload } from "lucide-react";
import { toast } from "sonner";
import { useOcr, useProductDetail } from "@/hooks";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import ProductCard from "@/components/common/ProductCard";

interface OcrModalProps {
  onClose: () => void;
}

export default function OcrModal({ onClose }: OcrModalProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [recognizedProductId, setRecognizedProductId] = useState<number | null>(
    null,
  );
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);

  const { mutate: recognize, isPending: isRecognizing } = useOcr();
  const { data: product, isLoading: isLoadingProduct } =
    useProductDetail(recognizedProductId);
  const handleFile = (file: File) => {
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

    // ⚠️ OCR 구현 시 루틴 추가 로직 연동 (ROUTINE_STEPS로 카테고리 매칭 후 추가)

    toast(`✓ ${product.productName} 루틴에 추가됨!`);
    onClose();
  };

  const isLoading = isRecognizing || isLoadingProduct;

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
        onClick={isLoading ? undefined : onClose}
      />

      {/* 모달 — 가운데 */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none py-10 px-5">
        <div
          className="pointer-events-auto w-full bg-white rounded-2xl flex flex-col overflow-hidden"
          style={{ maxWidth: "420px", maxHeight: "80vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDEBE8]">
            <h2 className="text-base font-bold text-[#2A2118]">
              OCR 제품 인식
            </h2>
            <button
              onClick={isLoading ? undefined : onClose}
              className={`w-8 h-8 flex items-center justify-center rounded-full bg-[#F2EFE9] border-none ${isLoading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <X size={14} className="text-[#8A8278]" />
            </button>
          </div>

          {/* 바디 */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {/* 카메라 / 업로드 버튼 */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
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

            <div className="flex gap-3 mb-5">
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading}
                className="flex-1 flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-[#D9D5D0] bg-[#F9F7F4] text-[#8A8278] font-semibold text-sm cursor-pointer transition-all hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Camera size={22} />
                카메라 촬영
              </button>
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={isLoading}
                className="flex-1 flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-[#D9D5D0] bg-[#F9F7F4] text-[#8A8278] font-semibold text-sm cursor-pointer transition-all hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload size={22} />
                이미지 업로드
              </button>
            </div>

            {/* 상태 표시 */}
            {isLoading && (
              <div className="flex justify-center py-6 text-sm text-[#A69D92]">
                {isRecognizing
                  ? "이미지 인식 중..."
                  : "제품 정보 불러오는 중..."}
              </div>
            )}

            {ocrFailed && !isLoading && (
              <div className="flex flex-col items-center py-6 gap-1">
                <p className="text-sm text-[#A69D92]">
                  제품을 인식하지 못했어요
                </p>
                <p className="text-xs text-[#BFB6AA]">
                  다시 촬영하거나 다른 이미지를 업로드해보세요
                </p>
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
                  skinTypes={(product.skinTypes ?? []).map(fromSkinTypeEnum)}
                  effects={product.tags ?? []}
                  variant="modal"
                  showActions={true}
                  showLike={false}
                  onAddRoutine={handleAddProduct}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
