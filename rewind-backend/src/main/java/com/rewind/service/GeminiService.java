package com.rewind.service;

import com.rewind.model.AIFeedback;
import com.rewind.model.UserQuestion;
import com.rewind.repository.AIFeedbackRepository;
import com.rewind.repository.ExplanationRecordingRepository;
import com.rewind.service.TranscriptService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class GeminiService {

    private final AIFeedbackRepository feedbackRepository;
    private final ExplanationRecordingRepository recordingRepository;
    private final com.rewind.repository.SolutionRepository solutionRepository;
    private final TranscriptService transcriptService;
    private final RestTemplate restTemplate;

    @Value("${gemini.api-key:}")
    private String apiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public GeminiService(AIFeedbackRepository feedbackRepository,
            ExplanationRecordingRepository recordingRepository,
            com.rewind.repository.SolutionRepository solutionRepository,
            TranscriptService transcriptService) {
        this.feedbackRepository = feedbackRepository;
        this.recordingRepository = recordingRepository;
        this.solutionRepository = solutionRepository;
        this.transcriptService = transcriptService;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Process recording analysis asynchronously (Solution Feedback + Transcription
     * + Communication Tips).
     */
    @org.springframework.scheduling.annotation.Async
    public void processRecording(UUID recordingId) {
        log.info("Starting async analysis for recording: {}", recordingId);

        var recordingOptional = recordingRepository.findById(recordingId);
        if (recordingOptional.isEmpty()) {
            log.error("Recording not found for async analysis: {}", recordingId);
            return;
        }

        var recording = recordingOptional.get();
        recording.setAnalysisStatus(com.rewind.model.ExplanationRecording.AnalysisStatus.PROCESSING);
        recordingRepository.save(recording);

        try {
            UserQuestion userQuestion = recording.getUserQuestion();

            // 1. Analyze Solution Code
            var latestSolution = solutionRepository.findLatestByUserQuestionId(userQuestion.getId());
            String code = latestSolution.map(com.rewind.model.Solution::getCode).orElse("");
            String language = latestSolution.map(com.rewind.model.Solution::getLanguage).orElse("python");

            analyzeSolution(userQuestion, recording, code, language);

            // 2. Transcribe Audio (if needed)
            if ((recording.getTranscript() == null || recording.getTranscript().isEmpty())
                    && recording.getAudioUrl() != null && !recording.getAudioUrl().isEmpty()) {
                log.info("Transcribing recording during async analysis: {}", recordingId);
                recording = transcriptService.transcribeRecording(recordingId);
            }

            // 3. Analyze Transcript (if available)
            String transcript = recording.getTranscript();
            if (transcript != null && transcript.length() > 20) {
                analyzeTranscript(userQuestion, recording, transcript);
            }

            // Mark as COMPLETED
            recording.setAnalysisStatus(com.rewind.model.ExplanationRecording.AnalysisStatus.COMPLETED);
            recordingRepository.save(recording);
            log.info("Async analysis completed for recording: {}", recordingId);

        } catch (Exception e) {
            log.error("Async analysis failed for recording: {}", recordingId, e);
            recording.setAnalysisStatus(com.rewind.model.ExplanationRecording.AnalysisStatus.FAILED);
            recordingRepository.save(recording);

            // Save error as feedback so user/dev can see it
            try {
                AIFeedback errorFeedback = AIFeedback.builder()
                        .userQuestion(recording.getUserQuestion())
                        .recording(recording)
                        .feedbackType(AIFeedback.FeedbackType.HINT) // Use HINT so it shows up
                        .message("⚠️ **Analysis Error**: " + e.getMessage())
                        .build();
                feedbackRepository.save(errorFeedback);
            } catch (Exception persistenceEx) {
                log.error("Failed to save error feedback", persistenceEx);
            }
        }
    }

    /**
     * Analyze a solution and generate AI feedback.
     */
    public List<AIFeedback> analyzeSolution(UserQuestion userQuestion, com.rewind.model.ExplanationRecording recording,
            String code, String language) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Gemini API key not configured, skipping analysis");
            return List.of();
        }

        List<AIFeedback> feedbackList = new ArrayList<>();

        // Generate hint/improvement suggestions
        String solutionPrompt = buildSolutionPrompt(userQuestion.getQuestion().getTitle(),
                userQuestion.getQuestion().getPattern().getName(), userQuestion.getQuestion().getDifficulty(), code,
                language);

        String solutionFeedback = callGemini(solutionPrompt);
        if (solutionFeedback != null) {
            AIFeedback hint = AIFeedback.builder().userQuestion(userQuestion).recording(recording)
                    .feedbackType(AIFeedback.FeedbackType.HINT).message(solutionFeedback).build();
            feedbackList.add(feedbackRepository.save(hint));
        }

        // Generate reflection question
        String reflectionPrompt = buildReflectionPrompt(userQuestion.getQuestion().getTitle(),
                userQuestion.getQuestion().getPattern().getName());

        String reflectionFeedback = callGemini(reflectionPrompt);
        if (reflectionFeedback != null) {
            AIFeedback reflection = AIFeedback.builder().userQuestion(userQuestion).recording(recording)
                    .feedbackType(AIFeedback.FeedbackType.REFLECTION_QUESTION).message(reflectionFeedback).build();
            feedbackList.add(feedbackRepository.save(reflection));
        }

        return feedbackList;
    }

    /**
     * Analyze a transcript and provide communication tips.
     */
    public AIFeedback analyzeTranscript(UserQuestion userQuestion, com.rewind.model.ExplanationRecording recording,
            String transcript) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Gemini API key not configured, skipping transcript analysis");
            return null;
        }

        String prompt = buildCommunicationPrompt(userQuestion.getQuestion().getTitle(), transcript);

        String feedback = callGemini(prompt);
        if (feedback != null) {
            AIFeedback tip = AIFeedback.builder().userQuestion(userQuestion).recording(recording)
                    .feedbackType(AIFeedback.FeedbackType.COMMUNICATION_TIP).message(feedback).build();
            return feedbackRepository.save(tip);
        }
        return null;
    }

    /**
     * Get feedback for a specific recording.
     */
    public List<AIFeedback> getFeedbackByRecording(UUID recordingId) {
        return feedbackRepository.findByRecordingIdOrderByCreatedAtDesc(recordingId);
    }

    /**
     * Get all feedback for a user question (legacy, for backwards compatibility).
     */
    public List<AIFeedback> getFeedback(UserQuestion userQuestion) {
        return feedbackRepository.findByUserQuestionIdOrderByCreatedAtDesc(userQuestion.getId());
    }

    // ========== PROMPTS ==========

    private String buildSolutionPrompt(String title, String pattern, String difficulty, String code, String language) {
        return """
                You are an expert DSA interview coach. Analyze this solution and provide concise, actionable feedback.

                **Problem:** %s
                **Pattern:** %s
                **Difficulty:** %s
                **Language:** %s

                **Solution Code:**
                ```%s
                %s
                ```

                Provide a brief, encouraging response covering:
                1. **What's Good:** One thing done well
                2. **Improvement:** Specific suggestions to make the code cleaner or more efficient
                3. **Optimizable:** Let user know if this can be optimised further

                Keep response under 150 words. Be strict and constructive.
                """.formatted(title, pattern, difficulty, language, language, code);
    }

    private String buildReflectionPrompt(String title, String pattern) {
        return """
                You are a Socratic DSA tutor. Generate ONE thought-provoking reflection question.

                **Problem:** %s
                **Pattern:** %s

                Create a question that helps the learner:
                - Connect this problem to similar problems
                - Think about when to use this pattern
                - Understand the core insight

                Be specific to this problem. Keep under 30 words.
                """.formatted(title, pattern);
    }

    private String buildCommunicationPrompt(String title, String transcript) {
        return """
                You are an interview communication coach. Analyze how this candidate explained their solution.

                **Problem:** %s

                **Transcript:**
                %s

                Provide multiple specific tip to improve their explanation for a FAANG interview.
                Focus on: clarity, structure, pacing, or technical vocabulary.

                Keep under 100 words. Be strict and constructive.
                """.formatted(title, transcript);
    }

    // ========== API CALL ==========

    private String callGemini(String prompt) {
        try {
            // Log API key status (not the key itself)
            log.info("Calling Gemini API, key configured: {}, key length: {}", apiKey != null && !apiKey.isEmpty(),
                    apiKey != null ? apiKey.length() : 0);

            String url = GEMINI_API_URL + "?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = Map.of("contents",
                    List.of(Map.of("parts", List.of(Map.of("text", prompt)))), "generationConfig",
                    Map.of("temperature", 0.7, "maxOutputTokens", 4000));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            log.info("Gemini API response status: {}", response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String text = extractTextFromResponse(response.getBody());
                log.info("Gemini returned text of length: {}", text != null ? text.length() : 0);
                return text;
            } else {
                log.warn("Gemini API returned non-OK status or empty body: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error calling Gemini API: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            e.printStackTrace();
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
}
