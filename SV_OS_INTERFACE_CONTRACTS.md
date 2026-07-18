# SV-OS Interface Contracts

## Document Status

- Version: 1.0
- Status: Implementation planning package
- Purpose: Define interface-level contracts for engines and capabilities without embedding implementation details

---

## Conventions

- Contracts describe the public shape of engine and capability interfaces.
- Payloads are expressed as data-oriented contracts.
- Implementations may evolve, but interfaces should remain stable.

---

## Graph Engine Contract

### Interface

- get_node(node_id: str) -> GraphNode
- list_neighbors(node_id: str) -> list[GraphEdge]
- traverse(start_node_id: str, depth: int) -> GraphTraversalResult
- create_node(payload: CreateGraphNodeRequest) -> GraphNode
- update_node(node_id: str, payload: UpdateGraphNodeRequest) -> GraphNode
- create_edge(payload: CreateGraphEdgeRequest) -> GraphEdge

### Data Contracts

- GraphNode
  - id: string
  - kind: string
  - title: string
  - metadata: object
  - created_at: datetime
- GraphEdge
  - id: string
  - source_id: string
  - target_id: string
  - relation: string
  - metadata: object
- GraphTraversalResult
  - nodes: list[GraphNode]
  - edges: list[GraphEdge]

---

## Knowledge Engine Contract

### Interface

- get_content(node_id: str) -> KnowledgeContent
- list_content(node_ids: list[str]) -> list[KnowledgeContent]
- upsert_content(payload: UpsertKnowledgeContentRequest) -> KnowledgeContent

### Data Contracts

- KnowledgeContent
  - node_id: string
  - body: string
  - summary: string
  - tags: list[string]
  - metadata: object

---

## Validation Engine Contract

### Interface

- validate_graph_change(change_request: GraphChangeRequest) -> ValidationReport
- validate_import(payload: ImportPayload) -> ValidationReport

### Data Contracts

- ValidationReport
  - valid: bool
  - errors: list[ValidationIssue]
  - warnings: list[ValidationIssue]
  - score: float
- ValidationIssue
  - code: string
  - message: string
  - reference: string | null

---

## Event Engine Contract

### Interface

- publish(event: DomainEvent) -> EventAck
- subscribe(topic: string, handler: EventHandler) -> SubscriptionHandle
- replay(topic: string, from_sequence: int | null) -> list[DomainEvent]

### Data Contracts

- DomainEvent
  - id: string
  - topic: string
  - payload: object
  - occurred_at: datetime
  - correlation_id: string | null
- EventAck
  - accepted: bool
  - sequence: int

---

## State Engine Contract

### Interface

- get_state(learner_id: str, node_id: str) -> LearnerState
- update_state(learner_id: str, node_id: str, state_update: StateUpdateRequest) -> LearnerState
- list_states(learner_id: str) -> list[LearnerState]

### Data Contracts

- LearnerState
  - learner_id: string
  - node_id: string
  - status: string
  - confidence: float
  - updated_at: datetime
- StateUpdateRequest
  - status: string
  - confidence: float
  - notes: string | null

---

## Dependency Engine Contract

### Interface

- get_readiness(learner_id: str, node_id: str) -> ReadinessResult
- get_blockers(learner_id: str, node_id: str) -> list[Blocker]

### Data Contracts

- ReadinessResult
  - node_id: string
  - ready: bool
  - blockers: list[Blocker]
  - prerequisite_ids: list[string]
- Blocker
  - type: string
  - reference_id: string
  - message: string

---

## Recommendation Engine Contract

### Interface

- get_next_recommendation(learner_id: str) -> Recommendation
- explain_recommendation(recommendation_id: str) -> RecommendationExplanation

### Data Contracts

- Recommendation
  - id: string
  - node_id: string
  - rationale: string
  - confidence: float
- RecommendationExplanation
  - recommendation_id: string
  - factors: list[string]
  - score_breakdown: object

---

## Learning Path Engine Contract

### Interface

- generate_path(learner_id: str, target_id: str) -> LearningPath

### Data Contracts

- LearningPath
  - id: string
  - learner_id: string
  - target_id: string
  - nodes: list[string]
  - milestones: list[LearningMilestone]
- LearningMilestone
  - id: string
  - node_id: string
  - title: string
  - completed: bool

---

## Career Engine Contract

### Interface

- get_career_matches(learner_id: str) -> list[CareerMatch]
- get_skill_gap(learner_id: str, career_id: str) -> SkillGapResult

### Data Contracts

- CareerMatch
  - career_id: string
  - title: string
  - match_score: float
  - reasons: list[string]
- SkillGapResult
  - career_id: string
  - missing_skills: list[string]
  - recommended_nodes: list[string]

---

## Assessment Engine Contract

### Interface

- submit_assessment(learner_id: str, payload: AssessmentSubmissionRequest) -> AssessmentResult

### Data Contracts

- AssessmentSubmissionRequest
  - assessment_id: string
  - answers: object
- AssessmentResult
  - assessment_id: string
  - score: float
  - passed: bool
  - feedback: string

---

## Search Engine Contract

### Interface

- search(query: str, filters: object | null) -> SearchResult

### Data Contracts

- SearchResult
  - query: string
  - items: list[SearchItem]
  - total: int
- SearchItem
  - id: string
  - title: string
  - kind: string
  - score: float
  - snippet: string

---

## Import Engine Contract

### Interface

- start_import(payload: ImportRequest) -> ImportJob
- get_import_status(job_id: str) -> ImportJob
- rollback_import(job_id: str) -> RollbackResult

### Data Contracts

- ImportJob
  - id: string
  - status: string
  - progress: float
  - created_at: datetime
- ImportRequest
  - source_uri: string
  - format: string
  - dry_run: bool
- RollbackResult
  - success: bool
  - message: string

---

## Capability API Contracts

### Recommendation Capability

- POST /capabilities/recommendations/next
  - Response: Recommendation

### Roadmap Capability

- POST /capabilities/roadmaps/generate
  - Response: LearningPath

### Career Capability

- GET /capabilities/careers/matches
  - Response: list[CareerMatch]

### Search Capability

- GET /capabilities/search
  - Response: SearchResult

### Import Capability

- POST /capabilities/imports/start
  - Response: ImportJob
