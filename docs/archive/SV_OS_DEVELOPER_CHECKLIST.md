# SV-OS Developer Checklist

## Document Status

- Version: 1.0
- Status: Implementation planning package
- Purpose: Provide a practical checklist for implementation teams

---

## Before Starting Work

- [ ] Review the architecture and implementation spec
- [ ] Confirm the relevant engine and capability boundaries
- [ ] Check existing repository conventions and coding standards
- [ ] Identify dependencies and required contracts
- [ ] Confirm the acceptance criteria for the work item

## During Implementation

- [ ] Keep business logic inside the correct engine
- [ ] Keep capability orchestration thin and explicit
- [ ] Use validation before mutation
- [ ] Publish domain events for state changes
- [ ] Write or update tests for the change
- [ ] Keep API schemas aligned with capability outputs
- [ ] Use shared packages for cross-app contracts

## Testing Expectations

- [ ] Unit tests cover engine logic
- [ ] Integration tests cover repository and API interactions
- [ ] Frontend tests cover feature behavior and state handling
- [ ] End-to-end tests cover critical user journeys

## Documentation Expectations

- [ ] Update inline docs and README references when interfaces change
- [ ] Record any contract changes in the shared contract docs
- [ ] Add operational notes if new background jobs or events are introduced

## Review Expectations

- [ ] Verify the change is aligned with the architecture
- [ ] Verify the change does not bypass existing validation or event rules
- [ ] Verify the change is backward compatible where required
- [ ] Confirm the implementation can be built and tested locally

## Release Readiness

- [ ] Smoke tests pass
- [ ] Metrics and logs are available for the new flow
- [ ] Rollback or recovery steps are documented
- [ ] The change has an owner and support path
