package com.rewind.controller;

import com.rewind.dto.QuestionDTO.*;
import com.rewind.model.Pattern;
import com.rewind.model.Question;
import com.rewind.repository.PatternRepository;
import com.rewind.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final PatternRepository patternRepository;

    @GetMapping("/questions")
    public ResponseEntity<?> getAllQuestions(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) UUID patternId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = "30") Integer size) {

        // If pagination requested
        if (page != null) {
            return getQuestionsPaginated(difficulty, patternId, page, size);
        }

        // Non-paginated (optimized with JOIN FETCH)
        List<Question> questions;

        if (difficulty != null && patternId != null) {
            questions = questionRepository.findByPatternIdAndDifficultyWithPatternOrderByOrderIndex(patternId,
                    difficulty);
        } else if (difficulty != null) {
            questions = questionRepository.findByDifficultyWithPatternOrderByOrderIndex(difficulty);
        } else if (patternId != null) {
            questions = questionRepository.findByPatternIdWithPatternOrderByOrderIndex(patternId);
        } else {
            questions = questionRepository.findAllWithPatternOrderByOrderIndex();
        }

        List<QuestionResponse> response = questions.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    private ResponseEntity<PagedQuestionResponse> getQuestionsPaginated(
            String difficulty, UUID patternId, int page, int size) {

        PageRequest pageable = PageRequest.of(page, size);
        Page<Question> questionsPage;

        if (difficulty != null) {
            questionsPage = questionRepository.findByDifficultyWithPatternPaginated(difficulty, pageable);
        } else if (patternId != null) {
            questionsPage = questionRepository.findByPatternIdWithPatternPaginated(patternId, pageable);
        } else {
            questionsPage = questionRepository.findAllWithPatternPaginated(pageable);
        }

        List<QuestionResponse> content = questionsPage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        PagedQuestionResponse response = PagedQuestionResponse.builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(questionsPage.getTotalElements())
                .totalPages(questionsPage.getTotalPages())
                .hasNext(questionsPage.hasNext())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<QuestionResponse> getQuestion(@PathVariable UUID id) {
        return questionRepository.findByIdWithPattern(id)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patterns")
    public ResponseEntity<List<PatternInfo>> getAllPatterns() {
        List<PatternInfo> patterns = patternRepository.findAll().stream()
                .map(this::toPatternInfo)
                .collect(Collectors.toList());

        return ResponseEntity.ok(patterns);
    }

    private QuestionResponse toResponse(Question q) {
        return QuestionResponse.builder()
                .id(q.getId())
                .title(q.getTitle())
                .difficulty(q.getDifficulty())
                .leetcodeUrl(q.getLeetcodeUrl())
                .timeMinutes(q.getTimeMinutes())
                .orderIndex(q.getOrderIndex())
                .pattern(toPatternInfo(q.getPattern()))
                .build();
    }

    private PatternInfo toPatternInfo(Pattern p) {
        return PatternInfo.builder()
                .id(p.getId())
                .name(p.getName())
                .category(p.getCategory())
                .shortMentalModel(p.getShortMentalModel())
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class PagedQuestionResponse {
        private List<QuestionResponse> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean hasNext;
    }
}
