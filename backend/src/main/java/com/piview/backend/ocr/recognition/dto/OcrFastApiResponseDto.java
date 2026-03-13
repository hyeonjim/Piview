package com.piview.backend.ocr.recognition.dto;

import java.util.List;

public record OcrFastApiResponseDto(
        String status,
        List<Candidate> top_candidates
) {
    public record Candidate(String text) {}
}