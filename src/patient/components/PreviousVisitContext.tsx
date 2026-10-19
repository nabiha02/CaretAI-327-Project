import { Icon } from "./Icon";
import type { VisitRecord } from "../types";

export function PreviousVisitContext({
  visit,
  expanded,
  onToggle,
  onView,
}: {
  visit: VisitRecord;
  expanded: boolean;
  onToggle: () => void;
  onView: () => void;
}) {
  return (
    <section className="previous-visit-context">
      <button className="previous-visit-context__toggle" type="button" aria-expanded={expanded} onClick={onToggle}>
        <span><Icon name="visits" size={16} /></span>
        <div><strong>Previous Visit Context</strong><p>Historical information from Visit #{visit.id} · {visit.date}</p></div>
        <Icon name="chevron" size={14} />
      </button>
      {expanded && (
        <div className="previous-visit-context__content">
          <div className="previous-context-summary"><div><span>Previous concern</span><strong>{visit.mainConcern}</strong><p>{visit.onset}{visit.pattern ? ` · ${visit.pattern}` : ""}</p></div><span>Previous / Historical</span></div>
          <div><span>Previously reported</span><div className="previous-context-chips">{visit.reportedInformation.map((item) => <i key={item}>{item}</i>)}</div></div>
          <div><span>Previous doctor recommendations</span>{visit.recommendations ? <div className="previous-recommendation-list"><p><strong>Medications:</strong> {visit.recommendations.medications.map((item) => `${item.name} · ${item.schedule} · ${item.duration}`).join("; ")}</p><p><strong>Tests:</strong> {visit.recommendations.tests.map((item) => `${item.name} · ${item.status}`).join("; ")}</p><p><strong>Diet:</strong> {visit.recommendations.diet.join(" ")}</p><p><strong>Instructions:</strong> {visit.recommendations.instructions}</p></div> : <p>No doctor recommendations were available.</p>}</div>
          <div><span>Previous follow-up instructions</span><p>{visit.followup?.instruction ?? "No follow-up instruction was recorded."}</p></div>
          <button type="button" onClick={onView}>View Previous Visit <Icon name="arrow" size={12} /></button>
        </div>
      )}
    </section>
  );
}
