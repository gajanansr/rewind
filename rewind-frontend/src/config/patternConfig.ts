/**
 * Pattern Configuration
 * Matches pattern names from the database with learning resources
 */

export interface PatternResource {
    name: string;
    youtubeUrl: string;
    theory: string;
    keyPoints: string[];
}

export const patternConfig: Record<string, PatternResource> = {

    "Two Pointers": {
        name: "Two Pointers",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/QzZ7nmouLTI?si=OrS8ajhFlbBin9ZA",
        theory: "Two Pointers is used when you need to scan a list efficiently using two indices instead of nested loops. Place pointers at strategic positions (start/end or slow/fast) and move them based on conditions.",
        keyPoints: [
            "Best for sorted arrays or pair comparisons",
            "Common forms: start-end, slow-fast",
            "Reduces O(n²) to O(n)",
            "Used in pair sum, palindrome, removing duplicates"
        ]
    },

    "Sliding Window": {
        name: "Sliding Window",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/GcW4mgmgSbw",
        theory: "Sliding Window handles problems involving contiguous subarrays or substrings. Instead of recalculating every window, you reuse previous computation by expanding and shrinking the window intelligently.",
        keyPoints: [
            "Used for contiguous ranges",
            "Fixed window vs variable window",
            "Expand right, shrink left",
            "Track state using sum, count, or hashmap"
        ]
    },

    "Fast & Slow Pointers": {
        name: "Fast & Slow Pointers",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/gBTe7lFR3vc",
        theory: "Fast & Slow Pointers (Floyd's Tortoise and Hare) uses two pointers moving at different speeds to detect cycles or find the middle of linked structures.",
        keyPoints: [
            "Slow moves 1 step, fast moves 2 steps",
            "Detect cycles in linked lists",
            "Find middle element efficiently",
            "O(1) space complexity"
        ]
    },

    "Merge Intervals": {
        name: "Merge Intervals",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/44H3cEC2fFM",
        theory: "Merge Intervals deals with overlapping intervals. Sort by start time, then iterate and merge when intervals overlap.",
        keyPoints: [
            "Sort intervals by start time first",
            "Check if current overlaps with previous",
            "Merge by updating end time",
            "Used in scheduling, calendar problems"
        ]
    },

    "Cyclic Sort": {
        name: "Cyclic Sort",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/JfinxytTYFQ",
        theory: "Cyclic Sort places each number at its correct index in O(n) time. It works when numbers are in a range [1, n] or [0, n-1].",
        keyPoints: [
            "Numbers must be in a known range",
            "Swap until correct position",
            "Find missing/duplicate numbers",
            "O(n) time, O(1) space"
        ]
    },

    "In-place Reversal of a Linked List": {
        name: "In-place Reversal of a Linked List",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/G0_I-ZF0S38",
        theory: "Reverse a linked list by changing next pointers in-place. Track previous, current, and next nodes to avoid losing references.",
        keyPoints: [
            "Use three pointers: prev, curr, next",
            "Save next before changing curr.next",
            "Reverse full list or sub-ranges",
            "O(n) time, O(1) space"
        ]
    },

    "Tree Breadth First Search": {
        name: "Tree Breadth First Search",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/HZ5YTanv5QE",
        theory: "BFS explores level by level using a queue. It guarantees the shortest path in unweighted graphs and is perfect for level-order traversals.",
        keyPoints: [
            "Uses queue data structure",
            "Process level by level",
            "Shortest path in unweighted graphs",
            "Good for minimum steps problems"
        ]
    },

    "Tree Depth First Search": {
        name: "Tree Depth First Search",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/PMMc4VsIacU",
        theory: "DFS explores as deep as possible before backtracking. It naturally fits recursive problems like trees and graphs.",
        keyPoints: [
            "Uses recursion or stack",
            "Preorder, Inorder, Postorder traversals",
            "Good for path problems",
            "Watch out for stack overflow"
        ]
    },

    "Two Heaps": {
        name: "Two Heaps",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/itmhHWaHupI",
        theory: "Two Heaps pattern uses a max-heap and min-heap together to efficiently find medians or solve problems requiring access to both smallest and largest elements.",
        keyPoints: [
            "Max-heap for smaller half",
            "Min-heap for larger half",
            "Keep heaps balanced",
            "O(log n) insert, O(1) median"
        ]
    },

    "Subsets": {
        name: "Subsets",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/REOH22Xwdkk",
        theory: "The Subsets pattern generates all possible combinations using backtracking or iterative approaches. Each element is either included or excluded.",
        keyPoints: [
            "Include/exclude decision tree",
            "Iterative: build from previous",
            "Handle duplicates by sorting first",
            "2^n total subsets"
        ]
    },

    "Modified Binary Search": {
        name: "Modified Binary Search",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/W9QJ8HaRvJQ",
        theory: "Modified Binary Search applies the halving principle to problems beyond simple search: rotated arrays, finding bounds, and optimization problems.",
        keyPoints: [
            "Requires monotonic property",
            "O(log n) time complexity",
            "Rotated array search",
            "Lower/upper bound variants"
        ]
    },

    "Top K Elements": {
        name: "Top K Elements",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/HqPJF2L5h9U",
        theory: "Top K Elements pattern uses a heap of size K to efficiently find the K largest or smallest elements without sorting the entire collection.",
        keyPoints: [
            "Min-heap for K largest",
            "Max-heap for K smallest",
            "Keep heap size at K",
            "O(n log k) complexity"
        ]
    },

    "Bitwise XOR": {
        name: "Bitwise XOR",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/7jkIUgLC29I",
        theory: "XOR has special properties: a^a=0, a^0=a. These properties help find single missing/duplicate numbers or swap values without extra space.",
        keyPoints: [
            "Same numbers cancel out",
            "Find single unique number",
            "Find two non-repeating numbers",
            "Space-efficient solutions"
        ]
    },

    "Backtracking": {
        name: "Backtracking",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/Nabbpl7y4Lo",
        theory: "Backtracking tries all possible options but abandons paths early when they violate constraints. Think of it as controlled brute force with pruning.",
        keyPoints: [
            "Choose → Explore → Unchoose",
            "Used in permutations, combinations",
            "Prune invalid branches early",
            "Often exponential complexity"
        ]
    },

    "0/1 Knapsack (Dynamic Programming)": {
        name: "0/1 Knapsack (Dynamic Programming)",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/oBt53YbR9Kk",
        theory: "Dynamic Programming solves problems by storing results of overlapping subproblems. The 0/1 Knapsack pattern involves choosing items (take or skip) to maximize value within constraints.",
        keyPoints: [
            "Define state and recurrence",
            "Take or skip decision",
            "Memoization or tabulation",
            "Space optimization possible"
        ]
    },

    "Topological Sort (Graph)": {
        name: "Topological Sort (Graph)",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/09_LlHjoEiY",
        theory: "Topological Sort orders vertices so dependencies come before dependents. It only works on Directed Acyclic Graphs (DAGs) and uses BFS (Kahn's) or DFS.",
        keyPoints: [
            "Only for DAGs",
            "Track in-degrees for BFS",
            "Course scheduling problems",
            "Detect cycles if not possible"
        ]
    },

    "K-way Merge": {
        name: "K-way Merge",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/ptYUCjfNhJY",
        theory: "K-way Merge merges K sorted arrays/lists using a min-heap to always get the smallest element across all lists efficiently.",
        keyPoints: [
            "Use min-heap of size K",
            "Track which list each element came from",
            "Merge sorted linked lists",
            "O(n log k) complexity"
        ]
    },

    "Monotonic Stack": {
        name: "Monotonic Stack",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/O1KeXo8lE8A",
        theory: "Monotonic Stack maintains a stack where elements are always in increasing or decreasing order. It efficiently solves 'next greater/smaller element' problems.",
        keyPoints: [
            "Increasing or decreasing order",
            "Pop elements that violate order",
            "Next greater/smaller element",
            "O(n) time complexity"
        ]
    },

    "Union Find": {
        name: "Union Find",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/ID00PMy0-vE",
        theory: "Union Find (Disjoint Set) tracks connected components dynamically. It shines in graph connectivity and cycle detection problems.",
        keyPoints: [
            "Path compression optimization",
            "Union by rank",
            "Nearly O(1) operations",
            "Cycle detection in undirected graphs"
        ]
    },

    "Island (Matrix Traversal)": {
        name: "Island (Matrix Traversal)",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/0kJJg876Yzw",
        theory: "Island problems involve exploring connected cells in a 2D grid using DFS or BFS. Mark visited cells to avoid revisiting.",
        keyPoints: [
            "4-directional or 8-directional moves",
            "Mark cells as visited",
            "Count connected components",
            "Flood fill technique"
        ]
    },

    "Greedy": {
        name: "Greedy",
        youtubeUrl: "https://www.youtube-nocookie.com/embed/bC7o8P_Ste4",
        theory: "Greedy algorithms make the best local decision at each step, hoping it leads to a global optimum. They work only when local optimal choices lead to global optimal.",
        keyPoints: [
            "Sort first, then iterate",
            "Prove correctness is important",
            "Interval scheduling problems",
            "Often combined with sorting"
        ]
    }
};

export const getPatternResource = (patternName: string): PatternResource | undefined => {
    return patternConfig[patternName];
};

export const PATTERN_ORDER = [
    "Two Pointers",
    "Sliding Window",
    "Fast & Slow Pointers",
    "Merge Intervals",
    "Cyclic Sort",
    "In-place Reversal of a Linked List",
    "Tree Breadth First Search",
    "Tree Depth First Search",
    "Two Heaps",
    "Subsets",
    "Modified Binary Search",
    "Top K Elements",
    "Bitwise XOR",
    "Backtracking",
    "0/1 Knapsack (Dynamic Programming)",
    "Topological Sort (Graph)",
    "K-way Merge",
    "Monotonic Stack",
    "Union Find",
    "Island (Matrix Traversal)",
    "Greedy"
];