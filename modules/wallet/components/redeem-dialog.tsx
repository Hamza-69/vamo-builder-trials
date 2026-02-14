"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
}

interface RedeemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  onConfirm: (amount: number, rewardType: string, projectId?: string) => Promise<void>;
}

const MIN_REDEEM = 50;

export function RedeemDialog({
  open,
  onOpenChange,
  balance,
  onConfirm,
}: RedeemDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [rewardType, setRewardType] = useState("uber_eats");
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's projects when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setProjectsLoading(true);
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const list: Project[] = (json.projects ?? []).map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }));
        setProjects(list);
        if (list.length > 0 && !projectId) {
          setProjectId(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => { cancelled = true; };
  }, [open]);

  const numAmount = Number(amount);
  const isValid =
    amount !== "" &&
    Number.isInteger(numAmount) &&
    numAmount >= MIN_REDEEM &&
    numAmount <= balance;

  const handleConfirm = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(numAmount, rewardType, projectId || undefined);
      setAmount("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redemption failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redeem Pineapples</DialogTitle>
          <DialogDescription>
            Convert your pineapples into rewards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Current balance display */}
          <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/50">
            <span className="text-3xl">🍍</span>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Current Balance
              </p>
              <p className="text-xl font-bold tabular-nums">
                {balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="redeem-amount">
              Amount to Redeem
            </label>
            <Input
              id="redeem-amount"
              type="number"
              min={MIN_REDEEM}
              max={balance}
              step={1}
              placeholder={`Min ${MIN_REDEEM}, Max ${balance}`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
            />
            {amount !== "" && numAmount < MIN_REDEEM && (
              <p className="text-xs text-destructive">
                Minimum redemption is {MIN_REDEEM} 🍍
              </p>
            )}
            {amount !== "" && numAmount > balance && (
              <p className="text-xs text-destructive">
                Exceeds your balance of {balance} 🍍
              </p>
            )}
          </div>

          {/* Reward type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reward Type</label>
            <Select value={rewardType} onValueChange={setRewardType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uber_eats">Uber Eats Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project selector */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                disabled={projectsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={projectsLoading ? "Loading…" : "Select a project"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The redemption will be logged under this project.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || submitting}>
            {submitting ? "Submitting…" : "Confirm Redemption"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
