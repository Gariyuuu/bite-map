"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { logVisit } from "@/lib/actions/status";
import type { NormalizedDish } from "@/types/restaurant";

const MEAL_TYPES = ["breakfast", "brunch", "lunch", "dinner", "dessert", "drinks", "snack"] as const;

function RatingSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-medium text-foreground">{value.toFixed(1)}</span>
      </div>
      <Slider min={0} max={10} step={0.5} value={value} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)} />
    </div>
  );
}

export function LogVisitDialog({
  restaurantId,
  restaurantName,
  dishes,
}: {
  restaurantId: string;
  restaurantName: string;
  dishes: NormalizedDish[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [visitedAt, setVisitedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<(typeof MEAL_TYPES)[number]>("dinner");
  const [companions, setCompanions] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [wouldReturn, setWouldReturn] = useState(true);
  const [detailed, setDetailed] = useState(false);
  const [overall, setOverall] = useState(8);
  const [food, setFood] = useState(8);
  const [value, setValue] = useState(8);
  const [service, setService] = useState(8);
  const [atmosphere, setAtmosphere] = useState(8);

  function submit() {
    startTransition(async () => {
      try {
        await logVisit({
          restaurantId,
          restaurantName,
          visitedAt: new Date(visitedAt).toISOString(),
          mealType,
          companions: companions
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          costTotal: cost ? Number(cost) : undefined,
          notes: notes || undefined,
          wouldReturn,
          overall,
          food: detailed ? food : undefined,
          value: detailed ? value : undefined,
          service: detailed ? service : undefined,
          atmosphere: detailed ? atmosphere : undefined,
        });
        toast.success(`Logged your visit to ${restaurantName}`);
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save this visit");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Log a visit</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log your visit to {restaurantName}</DialogTitle>
          <DialogDescription>Everything past the date is optional — add as much or as little as you want.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Meal</Label>
              <Select value={mealType} onValueChange={(v) => setMealType(v as typeof mealType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Who you went with</Label>
            <Input placeholder="e.g. Partner, Mom" value={companions} onChange={(e) => setCompanions(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Total cost</Label>
            <Input type="number" placeholder="48" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>

          <RatingSlider label="Overall rating" value={overall} onChange={setOverall} />

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="detailed-ratings" className="text-sm font-normal">
              Add detailed category ratings
            </Label>
            <Switch id="detailed-ratings" checked={detailed} onCheckedChange={setDetailed} />
          </div>

          {detailed && (
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3">
              <RatingSlider label="Food" value={food} onChange={setFood} />
              <RatingSlider label="Value" value={value} onChange={setValue} />
              <RatingSlider label="Service" value={service} onChange={setService} />
              <RatingSlider label="Atmosphere" value={atmosphere} onChange={setAtmosphere} />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="would-return" className="text-sm font-normal">
              Would return?
            </Label>
            <Switch id="would-return" checked={wouldReturn} onCheckedChange={setWouldReturn} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="What you ordered, how it went..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {dishes.length > 0 && <p className="text-xs text-muted-foreground">Dish ratings can be added from the Journal after saving.</p>}
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving..." : "Save visit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
