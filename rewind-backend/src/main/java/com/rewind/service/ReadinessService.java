package com.rewind.service;

import com.rewind.model.*;
import com.rewind.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class ReadinessService {

    private final UserRepository userRepository;
    private final UserQuestionRepository userQuestionRepository;
    private final QuestionRepository questionRepository;
    private final UserPatternStatsRepository patternStatsRepository;
    private final ReadinessEventRepository readinessEventRepository;
    private final ReadinessSnapshotRepository snapshotRepository;
    private final RevisionScheduleRepository revisionScheduleRepository;

    // Base day reduction values
    private static final double EASY_BASE = 0.3;
    private static final double MEDIUM_BASE = 0.5;
    private static final double HARD_BASE = 0.8;

    // Difficulty multipliers
    private static final double EASY_MULTIPLIER = 1.0;
    private static final double MEDIUM_MULTIPLIER = 1.5;
    private static final double HARD_MULTIPLIER = 2.5;

    // Revision bonus
    private static final double REVISION_EASY_BONUS = 0.2;
    private static final double REVISION_MEDIUM_BONUS = 0.3;
    private static final double REVISION_HARD_BONUS = 0.5;

    /**
     * Calculate readiness reduction when a question is completed.
     * Formula: days_reduced = base_value × difficulty_multiplier × pattern_weight ×
     * pace_bonus
     */
    @Transactional
    public ReadinessResult calculateQuestionCompletion(User user, UserQuestion userQuestion) {
        Question question = userQuestion.getQuestion();

        // Get base values based on difficulty
        double baseValue = getBaseValue(question.getDifficulty());
        double difficultyMultiplier = getDifficultyMultiplier(question.getDifficulty());

        // Pattern weight (1.0 - 1.3) - weak patterns get bonus
        double patternWeight = calculatePatternWeight(user, question.getPattern());

        // Pace bonus (1.0 - 1.2)
        double paceBonus = calculatePaceBonus(user);

        // Final calculation - use round, not ceil, but ensure at least some progress
        // for Hard questions
        double daysReduced = baseValue * difficultyMultiplier * patternWeight * paceBonus;
        int roundedDays = (int) Math.max(0, Math.round(daysReduced));

        // Update user's readiness
        int newDays = Math.max(0, user.getCurrentReadinessDays() - roundedDays);
        user.setCurrentReadinessDays(newDays);
        userRepository.save(user);

        // Record event
        recordEvent(user, -roundedDays,
                "Completed '" + question.getTitle() + "' (" + question.getDifficulty() + ")",
                question);

        return new ReadinessResult(newDays, daysReduced, roundedDays);
    }

    /**
     * Calculate readiness bonus when a revision is completed.
     */
    @Transactional
    public ReadinessResult calculateRevisionCompletion(User user, RevisionSchedule revision) {
        Question question = revision.getUserQuestion().getQuestion();

        double bonus = switch (question.getDifficulty()) {
            case "Easy" -> REVISION_EASY_BONUS;
            case "Medium" -> REVISION_MEDIUM_BONUS;
            case "Hard" -> REVISION_HARD_BONUS;
            default -> REVISION_EASY_BONUS;
        };

        int roundedDays = (int) Math.max(0, Math.round(bonus));
        int newDays = Math.max(0, user.getCurrentReadinessDays() - roundedDays);
        user.setCurrentReadinessDays(newDays);
        userRepository.save(user);

        recordEvent(user, -roundedDays,
                "Revised '" + question.getTitle() + "'",
                question);

        return new ReadinessResult(newDays, bonus, roundedDays);
    }

    /**
     * Get current readiness breakdown for a user.
     */
    public ReadinessBreakdown getBreakdown(User user) {
        long total = questionRepository.count();
        long completed = userQuestionRepository.countCompletedByUserId(user.getId());
        long easyComplete = userQuestionRepository.countCompletedByDifficulty(user.getId(), "Easy");
        long mediumComplete = userQuestionRepository.countCompletedByDifficulty(user.getId(), "Medium");
        long hardComplete = userQuestionRepository.countCompletedByDifficulty(user.getId(), "Hard");
        long revisionsComplete = revisionScheduleRepository.countCompletedByUserId(user.getId());

        // Calculate trend based on recent activity
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long recentCompletions = userQuestionRepository.countCompletedSince(user.getId(), weekAgo);

        String trend = recentCompletions > 7 ? "IMPROVING"
                : recentCompletions > 3 ? "STABLE"
                        : "SLOWING";

        return ReadinessBreakdown.builder()
                .daysRemaining(user.getCurrentReadinessDays())
                .targetDays(user.getInterviewTargetDays())
                .questionsSolved((int) completed)
                .questionsTotal((int) total)
                .easyComplete((int) easyComplete)
                .mediumComplete((int) mediumComplete)
                .hardComplete((int) hardComplete)
                .revisionsComplete((int) revisionsComplete)
                .trend(trend)
                .percentComplete((int) ((completed * 100) / total))
                .build();
    }

    private double getBaseValue(String difficulty) {
        return switch (difficulty) {
            case "Easy" -> EASY_BASE;
            case "Medium" -> MEDIUM_BASE;
            case "Hard" -> HARD_BASE;
            default -> EASY_BASE;
        };
    }

    private double getDifficultyMultiplier(String difficulty) {
        return switch (difficulty) {
            case "Easy" -> EASY_MULTIPLIER;
            case "Medium" -> MEDIUM_MULTIPLIER;
            case "Hard" -> HARD_MULTIPLIER;
            default -> EASY_MULTIPLIER;
        };
    }

    private double calculatePatternWeight(User user, Pattern pattern) {
        long totalForPattern = questionRepository.countByPatternId(pattern.getId());
        var stats = patternStatsRepository.findByUserIdAndPatternId(user.getId(), pattern.getId());

        if (stats.isEmpty() || totalForPattern == 0) {
            return 1.3; // Weak pattern bonus
        }

        double completionRate = stats.get().getQuestionsCompleted() / (double) totalForPattern;

        if (completionRate < 0.5)
            return 1.3;
        if (completionRate < 0.8)
            return 1.1;
        return 1.0;
    }

    private double calculatePaceBonus(User user) {
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long questionsThisWeek = userQuestionRepository.countCompletedSince(user.getId(), weekAgo);
        double avgPerDay = questionsThisWeek / 7.0;

        if (avgPerDay > 2)
            return 1.2;
        if (avgPerDay >= 1)
            return 1.1;
        return 1.0;
    }

    private void recordEvent(User user, int deltaDays, String reason, Question relatedQuestion) {
        ReadinessEvent event = ReadinessEvent.builder()
                .user(user)
                .changeDeltaDays(deltaDays)
                .reason(reason)
                .relatedQuestion(relatedQuestion)
                .build();
        readinessEventRepository.save(event);
    }

    // Result classes
    public record ReadinessResult(int newDaysRemaining, double exactReduction, int roundedReduction) {
    }

    @lombok.Builder
    @lombok.Data
    public static class ReadinessBreakdown {
        private int daysRemaining;
        private int targetDays;
        private int questionsSolved;
        private int questionsTotal;
        private int easyComplete;
        private int mediumComplete;
        private int hardComplete;
        private int revisionsComplete;
        private String trend;
        private int percentComplete;
    }
}
