package com.rewind.service;

import com.rewind.model.ExplanationRecording;
import com.rewind.repository.ExplanationRecordingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URL;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class TranscriptService {

    private final ExplanationRecordingRepository recordingRepository;
    private final RestTemplate restTemplate;

    @Value("${openai.api-key:}")
    private String openAiApiKey;

    private static final String WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";

    public TranscriptService(ExplanationRecordingRepository recordingRepository) {
        this.recordingRepository = recordingRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Transcribe audio from a URL using OpenAI Whisper API.
     * Returns the transcript text or null if transcription fails.
     */
    public String transcribe(String audioUrl) {
        if (openAiApiKey == null || openAiApiKey.isEmpty()) {
            log.warn("OpenAI API key not configured, skipping transcription");
            return null;
        }

        try {
            // Download audio file
            byte[] audioBytes = downloadAudio(audioUrl);
            if (audioBytes == null || audioBytes.length == 0) {
                log.warn("Failed to download audio from: {}", audioUrl);
                return null;
            }

            // Prepare multipart request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(openAiApiKey);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(audioBytes) {
                @Override
                public String getFilename() {
                    return "audio.webm";
                }
            });
            body.add("model", "whisper-1");
            body.add("language", "en");

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    WHISPER_API_URL,
                    request,
                    Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("text");
            }
        } catch (Exception e) {
            log.error("Error transcribing audio: {}", e.getMessage());
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
