# SV-OS Content Authoring Guide

> **Purpose**: Standards for writing and contributing knowledge content to SV-OS  
> **Date**: July 22, 2026 | **Status**: Design Complete

---

## Writing Principles

1. **Atomic**: Each topic covers exactly one concept. If it feels like two topics, split it.
2. **Self-contained**: A topic should be understandable without external references (though resources help).
3. **Progressive**: Start simple, build complexity. Assume the learner just completed prerequisites.
4. **Practical**: Every concept should answer "Why does this matter?" and "Where is this used?"
5. **Measurable**: Clear learning objectives with verifiable outcomes.

---

## Markdown Conventions

### File Structure

```
content/
├── domains/
│   └── computer-science.md
├── subjects/
│   ├── data-structures.md
│   └── algorithms.md
├── topics/
│   ├── arrays.md
│   ├── linked-lists.md
│   └── big-o-notation.md
├── careers/
│   ├── frontend-developer.md
│   └── ml-engineer.md
├── projects/
│   ├── build-rest-api.md
│   └── deploy-ml-model.md
└── resources/
    ├── books/
    ├── courses/
    └── videos/
```

### File Naming

| Element      | Convention      | Example                 |
| ------------ | --------------- | ----------------------- |
| Topic file   | `kebab-case.md` | `big-o-notation.md`     |
| Subject file | `kebab-case.md` | `data-structures.md`    |
| Domain file  | `kebab-case.md` | `computer-science.md`   |
| Career file  | `kebab-case.md` | `frontend-developer.md` |
| Project file | `kebab-case.md` | `build-rest-api.md`     |

### Frontmatter Template

Every content file starts with YAML frontmatter:

```yaml
---
slug: arrays
title: Arrays
type: topic
# Required fields
node_type: concept
difficulty: beginner
estimated_minutes: 45

# Classification
domain: computer-science
subject: data-structures
tags: [fundamental, linear-data-structures]

# Relationships
prerequisites:
  - variables
  - memory-basics
related:
  - linked-lists
  - dynamic-arrays

# Learning
learning_objectives:
  - 'Define an array and its key properties'
  - 'Perform insert, delete, and access operations'
  - 'Analyze time complexity of array operations'
  - 'Implement basic array algorithms'

# Metadata
keywords: [array, index, element, contiguous-memory]
icon: brackets
color: '#2563eb'
status: published
---
```

---

## Frontmatter Fields

### Required Fields

| Field               | Description                | Example                                 |
| ------------------- | -------------------------- | --------------------------------------- |
| `slug`              | URL-safe unique identifier | `big-o-notation`                        |
| `title`             | Human-readable title       | "Big O Notation"                        |
| `type`              | Entity type                | `topic`, `subject`, `career`, `project` |
| `node_type`         | Graph node type            | `concept`, `technology`, `tool`         |
| `difficulty`        | Learning difficulty        | `beginner`                              |
| `estimated_minutes` | Time to complete           | `45`                                    |

### Optional Fields

| Field                 | Description                  | Example                    |
| --------------------- | ---------------------------- | -------------------------- |
| `domain`              | Parent domain                | `computer-science`         |
| `subject`             | Parent subject               | `data-structures`          |
| `tags`                | Categorization tags          | `[fundamental, algorithm]` |
| `prerequisites`       | Required prior knowledge     | `[variables, functions]`   |
| `related`             | Related but not prerequisite | `[linked-lists]`           |
| `learning_objectives` | What learner will achieve    | See above                  |
| `keywords`            | Search optimization          | `[array, index, memory]`   |
| `icon`                | UI icon identifier           | `brackets`                 |
| `color`               | UI accent color              | `#2563eb`                  |
| `status`              | Publication status           | `draft`                    |
| `resources`           | Learning resources           | See resource format below  |
| `exercises`           | Practice exercises           | See exercise format below  |

---

## Content Structure

### Topic Template

```markdown
---
# (frontmatter as above)
---

## Overview

[A brief, engaging overview — 2-3 sentences maximum.
Tell the learner what this topic covers and why it matters.]

> Arrays are the most fundamental data structure in computer science.
> Understanding them is essential for mastering algorithms and memory management.

## Why This Matters

[Real-world relevance. Connect to careers, projects, or common interview scenarios.]

Every programming language uses arrays. They power everything from simple lists
to complex algorithms. Google, Amazon, and Microsoft all test array manipulation
in technical interviews.

## Key Concepts

[Core ideas presented as discrete items.]

### Concept 1: Memory Layout

Arrays store elements in contiguous memory locations. This means:

- Access by index is O(1) — instant
- Insert/delete at arbitrary positions is O(n) — requires shifting

### Concept 2: Static vs Dynamic

- Static arrays have fixed size (declared at creation)
- Dynamic arrays (like ArrayList, Vec) auto-resize
- Resizing costs O(n) but amortized cost is O(1)

## Code Examples

[Practical examples in common languages.]

\`\`\`python

# Creating and accessing an array

arr = [1, 2, 3, 4, 5]
print(arr[0]) # O(1) access — instant
arr.append(6) # O(1) amortized
\`\`\`

\`\`\`javascript
// Array operations in JavaScript
const arr = [1, 2, 3, 4, 5];
arr.push(6); // O(1) amortized
arr.splice(2, 1); // O(n) — shifts elements
\`\`\`

## Visual Diagram

[ASCII diagram or reference to diagram image.]
```

Index: 0 1 2 3 4
Value: [10] [20] [30] [40] [50]
Memory: 100 104 108 112 116 (contiguous)

```

## Common Pitfalls

[Frequent mistakes and misconceptions.]

- **Off-by-one errors**: Array indices start at 0, not 1
- **Out-of-bounds access**: Accessing arr[length] returns undefined/error
- **Assuming dynamic arrays are free**: Resizing has hidden cost

## Practice Exercises

1. **Easy**: Find the maximum element in an array
2. **Medium**: Implement array rotation by k positions
3. **Hard**: Find the longest increasing subsequence

## Check Your Understanding

[Self-assessment questions.]

1. What is the time complexity of accessing an element by index?
2. Why can't we insert at the beginning of an array in O(1)?
3. When would you choose an array over a linked list?

## Resources

- [Array (Data Structure) - Wikipedia](https://en.wikipedia.org/wiki/Array_(data_structure))
- [Khan Academy - Arrays](https://www.khanacademy.org/computing/computer-science/algorithms)
```

---

## Section Guidelines

| Section                       | Required | Max Length    | Description            |
| ----------------------------- | -------- | ------------- | ---------------------- |
| `## Overview`                 | ✅       | 3 sentences   | Hook the learner       |
| `## Why This Matters`         | ✅       | 1 paragraph   | Real-world relevance   |
| `## Key Concepts`             | ✅       | 3-5 concepts  | Core ideas             |
| `## Code Examples`            | ❌       | 3 examples    | Practical code         |
| `## Visual Diagram`           | ❌       | 1 diagram     | Visual learning aid    |
| `## Common Pitfalls`          | ✅       | 3-5 items     | Mistakes to avoid      |
| `## Practice Exercises`       | ❌       | 3 levels      | Difficulty progression |
| `## Check Your Understanding` | ✅       | 3-5 questions | Self-assessment        |
| `## Resources`                | ❌       | 3-5 links     | Further learning       |

---

## Difficulty Guidelines

| Level            | Assumes Knowledge   | Content Style                                                 |
| ---------------- | ------------------- | ------------------------------------------------------------- |
| **beginner**     | Nothing             | Analogy-first, simple examples, no jargon without explanation |
| **intermediate** | Basic programming   | Technical terms assumed, standard patterns                    |
| **advanced**     | Solid foundations   | Assumes deep understanding, edge cases, trade-offs            |
| **expert**       | Full specialization | Research frontiers, optimization, novel approaches            |

### Example: "Sorting Algorithms"

| Difficulty       | Content                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| **beginner**     | "Sorting puts things in order. Like organizing books alphabetically."                             |
| **intermediate** | "Bubble Sort: O(n²). Understand the algorithm. Implement it."                                     |
| **advanced**     | "QuickSort vs MergeSort: space/time trade-offs, pivot selection strategies, worst-case analysis." |
| **expert**       | "Cache-aware sorting algorithms, Timsort internals, parallel sorting on GPUs."                    |

---

## Prerequisites

### How to Write Prerequisites

```yaml
# Good — specific and verifiable
prerequisites:
  - variables # "What is a variable" — not "Python"
  - functions # "How to call a function" — not "Programming"

# Bad — too broad or vague
prerequisites:
  - programming # Everything requires programming
  - python # Specific language not required
  - basic-knowledge # Not a real prerequisite
```

### Prerequisite Types

| Type            | Meaning                   | Edge Type                 |
| --------------- | ------------------------- | ------------------------- |
| `prerequisites` | Must know before this     | PREREQUISITE_OF           |
| `recommended`   | Helpful but not required  | LEARNS_AFTER (weight 0.4) |
| `related`       | Connected but no ordering | RELATED_TO                |

---

## Learning Outcomes

### Bloom's Taxonomy Levels

Use action verbs appropriate to the level:

| Level          | Verbs                         | Example                                        |
| -------------- | ----------------------------- | ---------------------------------------------- |
| **Remember**   | List, define, identify        | "List the properties of an array"              |
| **Understand** | Explain, describe, summarize  | "Explain how dynamic arrays resize"            |
| **Apply**      | Implement, use, solve         | "Implement binary search on an array"          |
| **Analyze**    | Compare, contrast, categorize | "Compare array vs linked list performance"     |
| **Evaluate**   | Justify, critique, recommend  | "When would you use an array vs a hash table?" |
| **Create**     | Design, develop, build        | "Design a data structure using arrays"         |

---

## Exercises & Quiz Format

### Exercise Structure

```yaml
exercises:
  - id: array-max
    title: 'Find the Maximum Element'
    difficulty: easy
    type: coding
    prompt: 'Write a function that returns the maximum element in an array.'
    starter_code: |
      def find_max(arr):
          # Your code here
          pass
    solution: |
      def find_max(arr):
          return max(arr)
    hints:
      - 'Think about iterating through the array'
      - "Keep track of the largest value you've seen"
    test_cases:
      - input: [1, 5, 3, 9, 2]
        expected: 9
      - input: [-1, -5, -3]
        expected: -1
```

### Quiz Question Format

```yaml
questions:
  - id: array-access
    type: multiple-choice
    question: 'What is the time complexity of accessing an array element by index?'
    options:
      - 'O(1)'
      - 'O(n)'
      - 'O(log n)'
      - 'O(n²)'
    correct_answer: 0
    explanation: 'Arrays store elements in contiguous memory, so calculating the memory address of any element is a simple arithmetic operation.'
```

---

## Resource Linking

### Resource Reference Format

In frontmatter:

```yaml
resources:
  - title: 'React Official Docs'
    url: https://react.dev/
    type: documentation
    platform: react.dev
    is_free: true
    difficulty: beginner
    duration_minutes: 120
```

In body text:

```markdown
## Resources

- [React Official Documentation](https://react.dev/) — Start here for the official guide
- [React for Beginners (Wes Bos)](https://reactforbeginners.com/) — Paid course, highly recommended
- [React Tutorial on YouTube](https://youtube.com/react-tutorial) — Free video series
```

---

## Best Practices Summary

| Practice                       | Guideline                                          |
| ------------------------------ | -------------------------------------------------- |
| **One concept per file**       | If you're covering two ideas, split into two files |
| **Write for your successor**   | Assume the next author has no context              |
| **Keep it scannable**          | Use headings, lists, and code blocks               |
| **Show, don't just tell**      | Every concept needs an example                     |
| **Link early, link often**     | Cross-reference related topics                     |
| **Test your prerequisites**    | Make sure the chain works A→B→C                    |
| **Review for currency**        | Technology content becomes outdated                |
| **Write inclusive examples**   | Use diverse names and contexts                     |
| **Explain why, not just what** | Motivation drives learning                         |
| **Include anti-patterns**      | What NOT to do is as valuable as what to do        |

---

_Cross-reference: [KNOWLEDGE_SCHEMA.md](./KNOWLEDGE_SCHEMA.md), [KNOWLEDGE_IMPORT_SPEC.md](./KNOWLEDGE_IMPORT_SPEC.md)_
