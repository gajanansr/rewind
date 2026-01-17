package com.rewind.service;

import com.rewind.model.ExplanationRecording;
import com.rewind.repository.ExplanationRecordingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URL;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class TranscriptService {

    private final ExplanationRecordingRepository recordingRepository;
    private final RestTemplate restTemplate;

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public TranscriptService(ExplanationRecordingRepository recordingRepository) {
        this.recordingRepository = recordingRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Transcribe audio from a URL using Gemini API.
     * Returns the transcript text or null if transcription fails.
     */
    public String transcribe(String audioUrl) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            log.warn("Gemini API key not configured, skipping transcription");
            return null;
        }

        try {
            // Download audio file
            byte[] audioBytes = downloadAudio(audioUrl);
            if (audioBytes == null || audioBytes.length == 0) {
                log.warn("Failed to download audio from: {}", audioUrl);
                return null;
            }

            // Convert to base64
            String audioBase64 = Base64.getEncoder().encodeToString(audioBytes);

            // Determine MIME type
            String mimeType = audioUrl.contains(".webm") ? "audio/webm" : "audio/mpeg";

            // Build Gemini request with audio
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(
                                    Map.of(
                                            "inline_data", Map.of(
                                                    "mime_type", mimeType,
                                                    "data", audioBase64)),
                                    Map.of("text",
                                            "Transcribe this audio exactly. Just output the transcription, nothing else.")))),
                    "generationConfig", Map.of(
                            "temperature", 0.1,
                            "maxOutputTokens", 2000));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = GEMINI_API_URL + "?key=" + geminiApiKey;
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("Calling Gemini API for transcription, audio size: {} bytes", audioBytes.length);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String transcript = extractTextFromResponse(response.getBody());
                log.info("Transcription successful, length: {}", transcript != null ? transcript.length() : 0);
                return transcript;
            }
        } catch (Exception e) {
            log.error("Error transcribing audio with Gemini: {}", e.getMessage());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                if (parts != null && !parts.isEmpty()) {
                    return (String) parts.get(0).get("text");
                }
            }
        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Transcribe a recording and update the database.
     */
    public ExplanationRecording transcribeRecording(UUID recordingId) {
        var recording = recordingRepository.findById(recordingId)
                .orElseThrow(() -> new RuntimeException("Recording not found"));

        if (recording.getAudioUrl() == null || recording.getAudioUrl().isEmpty()) {
            log.warn("Recording {} has no audio URL", recordingId);
            return recording;
        }

        String transcript = transcribe(recording.getAudioUrl());
        if (transcript != null) {
            recording.setTranscript(transcript);
            return recordingRepository.save(recording);
        }
        return recording;
    }

    /**
     * Get transcript for a recording.
     */
    public String getTranscript(UUID recordingId) {
        return recordingRepository.findById(recordingId)
                .map(ExplanationRecording::getTranscript)
                .orElse(null);
    }

    private byte[] downloadAudio(String audioUrl) {
        try {
            URL url = new URL(audioUrl);
            return url.openStream().readAllBytes();
        } catch (Exception e) {
            log.error("Error downloading audio: {}", e.getMessage());
            return null;
        }
    }
}
