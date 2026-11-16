import { missingFields, type Draft } from "@contextpilot/shared";
export function CampaignProgress({ draft }: { draft: Draft }) {
  const count = 8 - missingFields(draft).length;
  return (
    <div className="progress-wrap">
      <div>
        <strong>{count} of 8 details ready</strong>
        <span>{Math.round((count / 8) * 100)}%</span>
      </div>
      <progress aria-label="Campaign completeness" value={count} max={8} />
    </div>
  );
}
