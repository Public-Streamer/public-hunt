import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { DogData } from "./DogCard";

interface ScorecardDetailsProps {
  dogs: DogData[];
  onSave: (dog: DogData, newTotal: number) => void;
  canEdit?: boolean;
}

const calcTotals = (entries: DogData["entries"]) => {
  const total = entries.reduce((sum, e) => {
    if (e.outcome === "+") return sum + e.points;
    if (e.outcome === "-") return sum - e.points;
    return sum;
  }, 0);
  const strikes = entries.filter((e) => e.type === "strike").length;
  const trees = entries.filter((e) => e.type === "tree").length;
  return { total, strikes, trees };
};

const outcomeSymbol = (o: string) => (o === "+" ? "+" : o === "-" ? "–" : o === "o" ? "◯" : o === "/" ? "╱" : "…");

export const ScorecardDetails: React.FC<ScorecardDetailsProps> = ({ dogs, onSave, canEdit = false }) => {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Scorecard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {dogs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No teams yet.</div>
        ) : (
          dogs.map((d) => {
            const { total, strikes, trees } = calcTotals(d.entries);
            return (
              <div key={d.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Dog: {d.dogName || "—"} • Handler: {d.handler || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {d.cityState || "—"} • {d.breed || "—"} • {d.age != null ? `${d.age} yr` : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary">Strikes: {strikes}</Badge>
                    <Badge variant="secondary">Trees: {trees}</Badge>
                    <Badge variant="outline">Total: {total}</Badge>
                  </div>
                </div>

                {/* Entries Breakdown */}
                <div className="mt-3 space-y-1">
                  {d.entries.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No strikes or trees recorded.</div>
                  ) : (
                    d.entries.map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-xs border rounded p-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">{e.type}</Badge>
                          <span className="tabular-nums">{e.points}</span>
                        </div>
                        <div className="font-bold">{outcomeSymbol(e.outcome)}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Judge Notes */}
                <div className="mt-3">
                  <div className="text-xs font-medium mb-1">Judge Notes</div>
                  {canEdit ? (
                    <Textarea
                      placeholder="Enter notes..."
                      defaultValue={d.judgeNotes || ""}
                      onBlur={(e) => onSave({ ...d, judgeNotes: e.currentTarget.value }, total)}
                      className="min-h-[80px]"
                    />
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">{d.judgeNotes || "—"}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default ScorecardDetails;
