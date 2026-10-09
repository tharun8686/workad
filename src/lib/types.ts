export const strategies = ['BUILD', 'BUY', 'BORROW', 'AUTOMATE', 'RELOCATE'] as const;
export type Strategy = typeof strategies[number];
export type Allocation = Strategy | 'BUILD + BORROW';
export type Weights = Record<Strategy, Record<string, number>>;
export type Person = {
  company?:string; level?:import('./intelligence').Level;
  conversionInterest?: 'Yes' | 'No' | 'Unknown'; reservedFor?: string; id: string; name: string; kind: 'employee' | 'contractor' | 'candidate'; role: string;
  location: string; experience: number; salary: number; rate: number; availability: number;
  performance: number; learning: number; promotionEligible: boolean;
  skills: Record<string, number>; projects: string[]; certifications: string[]; sourceId: string;
};
export type Skill = { id: string; name: string; category: string; aliases: string[]; trainingDays: number | null; trainingCost: number | null; adjacent: string[]; sourceUrl?:string; trainingEvidence?:string };
export type Source = { id: string; name: string; url: string; category: string; dataset: string; fields: string[]; type: string; license: string; retrieved: string; period: string; status: string; refreshed: string | null };
export type RequirementInput = {
  role: string; headcount: number; location: string; budget: number; deadline: number;
  experienceMin: number; experienceMax: number; mandatorySkills: string[]; optionalSkills: string[];
  skillWeights: Record<string, number>; businessUnit: string; priority: 'Standard' | 'High' | 'Critical';
  durationMonths: number; repetitivePct: number; remoteAllowed: boolean; rawText: string;
};
export type Match = Person & { match: number; skillMatch: number; missing: string[]; trainingDays: number; trainingCost: number; trainingKnown?: boolean; readyDays: number; suitable: boolean; breakdown: Record<string, number> };
export type StrategyResult = {
  strategy: Strategy; score: number; criteria: Record<string, number>; weights: Record<string, number>;
  cost: number; days: number; coverage: number; risk: number; viable: boolean; evidence: string[]; caveat: string;
};
export type ScenarioInput = { name: string; strategy: Allocation; headcount: number; budget: number; deadline: number; location: string; buildCount: number; durationMonths: number; repetitivePct: number };
export type ScenarioResult = ScenarioInput & { calibration?:{baseCost:number;baseDays:number;samples:number}; cost: number; days: number; coverage: number; risk: number; score: number; budgetDifference: number; timelineDifference: number; feasible: boolean; notes: string[] };
export type Analysis = { internal: Match[]; contractors: Match[]; candidates: Match[]; ranking: StrategyResult[]; recommendation: Allocation; confidence: number; hybrid: ScenarioResult; locations: { city: string; cost: number; days: number; coverage: number; score: number; salary: null; costIndex: null }[]; questions: string[]; explanation: string[]; normalization: { input: string; normalized: string; confidence: number; method: string }[] };
export type Requirement = RequirementInput & { id: string; ownerId: string; createdAt: string; status: 'Awaiting review' | 'Approved' | 'Rejected'; analysis: Analysis; weights: Weights; stages: { name: string; state: 'Waiting' | 'Processing' | 'Completed' | 'Failed'; note: string }[] };
export type Decision = { sourcingOnly?: boolean; id: string; requirementId: string; actor: string; outcome: 'Approved' | 'Modified' | 'Rejected'; original: Allocation; selected: Allocation; comment: string; createdAt: string; weights: Weights; snapshot: ScenarioResult };
export type Action = { id: string; requirementId: string; decisionId: string; strategy: Strategy; title: string; owner: string; status: 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Cancelled'; createdAt: string; history: { status: string; at: string; actor: string; note: string }[]; details: Record<string, unknown> };
export type Workspace = { requirements: Requirement[]; decisions: Decision[]; actions: Action[]; scenarios: (ScenarioResult & { id: string; requirementId: string })[]; people: Person[]; skills: Skill[]; sources: Source[]; reviews: { id: string; input: string; status: string; resolvedTo?: string }[]; mode: 'Local sandbox' | 'Connected'; actor: { name: string; role: string }; aiAvailable: boolean };
