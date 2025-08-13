import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, Image, FileText } from "lucide-react";
import type { DogData } from "./DogCard";

interface ScorecardDetailsProps {
  dogs: DogData[];
  onSave: (dog: DogData, newTotal: number) => void;
  canEdit?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  glowClassName?: string;
}

const calcTotals = (entries: DogData["entries"]) => {
  const total = entries.reduce((sum, e) => {
    if (e.outcome === "+") return sum + e.points;
    if (e.outcome === "-") return sum - e.points;
    return sum;
  }, 0);
  const circleTotal = entries.reduce((sum, e) => e.outcome === "o" ? sum + e.points : sum, 0);
  const strikes = entries.filter((e) => e.type === "strike").length;
  const trees = entries.filter((e) => e.type === "tree").length;
  return { total, circleTotal, strikes, trees };
};

const outcomeSymbol = (o: string) => (o === "+" ? "+" : o === "-" ? "–" : o === "o" ? "◯" : o === "/" ? "╱" : "…");

export const ScorecardDetails: React.FC<ScorecardDetailsProps> = ({ dogs, onSave, canEdit = false, open: controlledOpen, onOpenChange, glowClassName }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(controlledOpen ?? false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(v);
    onOpenChange?.(v);
  };
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`glow-surface ${glowClassName ?? ''}`}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Full Scorecard</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle scorecard">
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {dogs.length === 0 ? (
              <div className="text-sm text-muted-foreground">No teams yet.</div>
            ) : (
              dogs.map((d) => {
                const { total, circleTotal, strikes, trees } = calcTotals(d.entries);
                const showCircleAsTotal = total === 0 && circleTotal > 0;
                return (
                  <div key={d.id} className="rounded-md border p-3">
                    {/* Names section - horizontal layout */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-sm sm:text-base md:text-lg font-extrabold text-foreground min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {d.name}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-foreground space-y-1">
                        <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          Dog: {d.dogName || "—"}
                        </div>
                        <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          Handler: {d.handler || "—"}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-foreground mt-1 space-y-1">
                        <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {d.cityState || "—"}
                        </div>
                        <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {d.breed || "—"} • {d.age != null ? `${d.age} yr` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Photos and badges section */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        {d.dogPhotoUrl && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-accent"
                                title="View dog photo"
                              >
                                <img
                                  src={d.dogPhotoUrl}
                                  alt={`${d.dogName || d.name} photo`}
                                  className="h-6 w-6 rounded object-cover"
                                />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>{d.dogName || d.name} - Photo</DialogTitle>
                              </DialogHeader>
                              <div className="mt-4">
                                <img
                                  src={d.dogPhotoUrl}
                                  alt={`${d.dogName || d.name} photo`}
                                  className="w-full h-auto max-h-[70vh] object-contain rounded"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {d.pedigreeImageUrl && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-accent"
                                title="View pedigree"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>{d.dogName || d.name} - Pedigree</DialogTitle>
                              </DialogHeader>
                              <div className="mt-4">
                                <img
                                  src={d.pedigreeImageUrl}
                                  alt={`${d.dogName || d.name} pedigree`}
                                  className="w-full h-auto max-h-[70vh] object-contain rounded"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary">Strikes: {strikes}</Badge>
                        <Badge variant="secondary">Trees: {trees}</Badge>
                        <div className="flex items-center gap-1 bg-background/50 rounded px-2 py-1 border">
                          {showCircleAsTotal ? (
                            <>
                              <span className="font-bold">Total: </span>
                              <span className="font-bold rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">{circleTotal}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold">Total: {Math.abs(total)}</span>
                              {total > 0 && <span className="font-bold text-lg text-green-600">+</span>}
                              {total < 0 && <span className="font-bold text-lg text-red-600">–</span>}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Entries Breakdown */}
                    <div className="mt-3 space-y-1">
                      {d.entries.length === 0 ? (
                        <div className="text-xs text-muted-foreground">No strikes or trees recorded.</div>
                      ) : (
                        d.entries.map((e) => {
                          const color = e.outcome === "+"
                            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40"
                            : e.outcome === "-"
                            ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40"
                            : e.outcome === "o"
                            ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/40"
                            : e.outcome === "pending"
                            ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/40"
                            : "bg-muted/20 border-muted/40";
                          
                          const typeColor = e.type === "strike" 
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200" 
                            : "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200";
                          
                          const isPending = e.outcome === "pending";
                          
                          return (
                            <div key={e.id} className={`flex items-center justify-between text-xs border rounded p-1 ${color} ${isPending ? "animate-pulse" : ""}`}>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={`capitalize ${typeColor}`}>{e.type}</Badge>
                                {e.outcome === "o" ? (
                                  <span className="tabular-nums rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">{e.points}</span>
                                ) : (
                                  <span className="tabular-nums">{e.points}</span>
                                )}
                                {isPending && (
                                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              {e.outcome !== "o" && !isPending && (
                                <div className={`font-bold ${
                                  e.outcome === "+" ? "text-green-600 text-lg" : 
                                  e.outcome === "-" ? "text-red-600 text-base" : 
                                  "text-muted-foreground"
                                }`}>
                                  {outcomeSymbol(e.outcome)}
                                </div>
                              )}
                            </div>
                          );
                        })
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ScorecardDetails;
