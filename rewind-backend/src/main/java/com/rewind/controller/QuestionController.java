package com.rewind.controller;

import com.rewind.dto.QuestionDTO.*;
import com.rewind.model.Pattern;
import com.rewind.model.Question;
import com.rewind.repository.PatternRepository;
import com.rewind.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<List<QuestionResponse>> getAllQuestions(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) UUID patternId) {
        List<Question> questions;

        if (difficulty != null && patternId != null) {
            // Both filters applied
            questions = questionRepository.findByPatternIdAndDifficultyOrderByOrderIndexAsc(patternId, difficulty);
        } else if (difficulty != null) {
            // Only difficulty filter
            questions = questionRepository.findByDifficultyOrderByOrderIndexAsc(difficulty);
        } else if (patternId != null) {
            // Only pattern filter
            questions = questionRepository.findByPatternIdOrderByOrderIndexAsc(patternId);
        } else {
            // No filters
            questions = questionRepository.findAllByOrderByOrderIndexAsc();
        }

        List<QuestionResponse> response = questions.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<QuestionResponse> getQuestion(@PathVariable UUID id) {
        return questionRepository.findById(id)
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
}
