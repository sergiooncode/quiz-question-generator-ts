// Mechanical gates — deterministic structural checks (Stage 0 of the funnel)
export { runMechanicalGates } from './mechanical-gates';
export type {
  MechanicalGateInput,
  MechanicalGateResult,
  MechanicalGateFailure,
  MechanicalGateFailureCode,
} from './mechanical-gates';

// Option label normalization
export { stripOptionLabel } from './option-label';
