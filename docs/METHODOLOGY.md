# Decision methodology

## Evidence layers

1. Official reference data: O*NET occupation titles/tasks/software examples and Microsoft Learn content.
2. Owner-provided observations: assessed profiles, source authority, dates, compensation expectations and availability.
3. Public or authorized advertisement samples: source-linked demand observations, not candidate supply.
4. Planning assumptions: time, fees, working hours, training plans and automation hypotheses.
5. Human outcomes: approvals, work notes, applications and recorded recruitment events.

Never treat one layer as proof of another. Private workforce evidence is not sent to unpaid Gemini.

## Normalization and matching

Role normalization uses an exact case-insensitive O*NET canonical/alternate-title match only when it resolves to one occupation. Ambiguous or unknown titles are retained. Skill names and reviewed aliases normalize imported proficiency keys and requirement skills consistently. When multiple imported labels map to one skill, the highest supplied value is retained; normalization does not invent new proficiency. Role mapping is recorded alongside skill normalization.

Mandatory skill match is the importance-weighted assessed proficiency (weights total 100). A score below 65 marks a skill gap. Existing matching combines skill score with experience, availability and category-specific measured inputs. Suitable matches require skill match at least 60, modeled readiness within deadline, experience score at least 75, permitted location and no reservation to another requirement. An employee with gaps additionally needs a known training duration and cost for every gap.

Workspace training estimates require an evidence note; they are forecasts, not O*NET measurements. Missing estimates remain null. Course duration alone does not establish readiness.

## Scenario arithmetic

- BUILD: annual salary in INR lakh × 100,000 × horizon/12, plus documented training costs for selected internal people. Salary is included as opportunity cost. Training durations are sequential; readiness adds availability.
- BORROW: actual imported hourly INR rate × 160 assumed hours/month × horizon. Readiness uses availability.
- BUILD + BORROW: sums selected whole-person components; readiness is their maximum. Reserved people are excluded.
- BUY / RELOCATE: suitable candidate average annual expectations × 100,000 × (horizon/12 + 0.08 recruiting fee) × positions. If candidate expectations are unavailable, the entered budget is an explicit fallback assumption and coverage stays insufficient.
- External readiness: maximum of 35 assumed minimum days and selected candidate availability + 14 assumed onboarding days.
- AUTOMATE: INR 250,000 setup + INR 75,000 per assumed FTE capacity reduction + residual external hiring costs. Reduction is floor(headcount × repetitivePct/100). Readiness is at least 45 assumed implementation days. These are hypotheses requiring process validation.

Feasibility requires modeled coverage at least requested headcount, readiness no later than the deadline, and cost within the horizon-adjusted budget. Relative score does not establish feasibility. Unknown market salary, supply and competition values are not filled with constants.

Strategy scores use disclosed weighted criteria. Some criteria (e.g. retention and delivery risk) are planning assumptions, not measured probabilities. The evidence confidence indicator combines 50% record-category coverage, 30% normalized skill coverage, and 20% score separation. It is not a probability of a successful employee or hire.

## Human decisions and capacity

Approval recalculates with the latest catalogue and current reservations under database locks. A new Build/Borrow approval reserves selected people and creates decision/work records atomically. Release requires completed/cancelled related work and a recorded reason. Completion does not itself mean a person is free. Reservations are whole-person, per owner and per imported identity; they do not model dates/fractions or resolve duplicate identities from different sources.

Saved analyses remain snapshots until recalculated. Existing approvals preceding reservations are not backfilled silently. Historical decision snapshots remain unchanged by new imports.

A reviewer can explicitly authorize a BUY/RELOCATE **sourcing investigation** despite infeasible capacity/cost/time, with a detailed rationale. The snapshot remains infeasible and the decision records sourcingOnly. This authorizes investigation and a draft requisition, not an offer or a fulfillment guarantee. Actual offers and hires require separate human decisions in the recruitment pipeline.

## Market statistics

Authorized snapshot annual pay percentiles use interpolated percentiles of the midpoint of each explicit annual salary range. Predicted salaries, unknown values and nonannual periods are excluded. Deduplication is by listing ID within the snapshot. Currency remains the source country's currency. The sample is not representative of all employers or compensation packages.

Observed recruitment time-to-fill is opening-to-confirmed-hire duration for recorded hires. It is not inferred from advertisement age and is not an external benchmark. Channel counts describe actual recorded applications and hires; small samples cannot establish causal channel effectiveness.
