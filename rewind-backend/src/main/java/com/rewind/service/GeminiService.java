package com.rewind.service;

import com.rewind.model.AIFeedback;
import com.rewind.model.UserQuestion;
import com.rewind.repository.AIFeedbackRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    private final AIFeedbackRepository feedbackRepository;
    private final RestTemplate restTemplate;

    @Value("${gemini.api-key:}")
    private String apiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public GeminiService(AIFeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Analyze a solution and generate AI feedback.
     */
    public List<AIFeedback> analyzeSolution(UserQuestion userQuestion, String code, String language) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Gemini API key not configured, skipping analysis");
            return List.of();
        }

        List<AIFeedback> feedbackList = new ArrayList<>();

        // Generate hint/improvement suggestions
        String solutionPrompt = buildSolutionPrompt(
                userQuestion.getQuestion().getTitle(),
                userQuestion.getQuestion().getPattern().getName(),
                userQuestion.getQuestion().getDifficulty(),
                code,
                language);

        String solutionFeedback = callGemini(solutionPrompt);
        if (solutionFeedback != null) {
            AIFeedback hint = AIFeedback.builder()
                    .userQuestion(userQuestion)
                    .feedbackType(AIFeedback.FeedbackType.HINT)
                    .message(solutionFeedback)
                    .build();
            feedbackList.add(feedbackRepository.save(hint));
        }

        // Generate reflection question
        String reflectionPrompt = buildReflectionPrompt(
                userQuestion.getQuestion().getTitle(),
                userQuestion.getQuestion().getPattern().getName());

        String reflectionFeedback = callGemini(reflectionPrompt);
        if (reflectionFeedback != null) {
            AIFeedback reflection = AIFeedback.builder()
                    .userQuestion(userQuestion)
                    .feedbackType(AIFeedback.FeedbackType.REFLECTION_QUESTION)
                    .message(reflectionFeedback)
                    .build();
            feedbackList.add(feedbackRepository.save(reflection));
        }

        return feedbackList;
    }

    /**
     * Analyze a transcript and provide communication tips.
     */
    public AIFeedback analyzeTranscript(UserQuestion userQuestion, String transcript) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Gemini API key not configured, skipping transcript analysis");
            return null;
        }

        String prompt = buildCommunicationPrompt(
                userQuestion.getQuestion().getTitle(),
                transcript);

        String feedback = callGemini(prompt);
        if (feedback != null) {
            AIFeedback tip = AIFeedback.builder()
                    .userQuestion(userQuestion)
                    .feedbackType(AIFeedback.FeedbackType.COMMUNICATION_TIP)
                    .message(feedback)
                    .build();
            return feedbackRepository.save(tip);
        }
        return null;
    }

    /**
     * Get all feedback for a user question.
     */
    public List<AIFeedback> getFeedback(UserQuestion userQuestion) {
        return feedbackRepository.findByUserQuestionIdOrderByCreatedAtDesc(userQuestion.getId());
    }

    // ========== PROMPTS ==========

    private String buildSolutionPrompt(String title, String pattern, String difficulty, String code, String language) {
        return """
                You are an expert DSA interview coach. Analyze this solution and provide actionable feedback.

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
                2. **Improvement:** One specific suggestion to make the code cleaner or more efficient
                3. **Edge Case:** One edge case to consider

                Keep response under 150 words. Be friendly and constructive.
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

                Provide ONE specific tip to improve their explanation for a FAANG interview.
                Focus on: clarity, structure, pacing, or technical vocabulary.

                Keep under 50 words. Be encouraging.
                """.formatted(title, transcript);
    }

    // ========== API CALL ==========

    private String callGemini(String prompt) {
        try {
            // Log API key status (not the key itself)
            log.info("Calling Gemini API, key configured: {}, key length: {}",
                    apiKey != null && !apiKey.isEmpty(),
                    apiKey != null ? apiKey.length() : 0);

            String url = GEMINI_API_URL + "?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of(
                            "temperature", 0.7,
                            "maxOutputTokens", 300));

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
