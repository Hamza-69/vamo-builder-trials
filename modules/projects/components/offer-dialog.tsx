"use client";

import {
  SparklesIcon,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { OfferData } from "../hooks/use-offer";
import { TooltipContent, TooltipProvider, TooltipTrigger, Tooltip } from "@/components/ui/tooltip";

// ─── Helpers ──────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Component ────────────────────────────────────────────────

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: OfferData | null;
  progressScore: number;
  isLoading: boolean;
  error: string | null;
  onListForSale: (offerLow: number, offerHigh: number) => void;
}

export function OfferDialog({
  open,
  onOpenChange,
  offer,
  progressScore,
  isLoading,
  error,
  onListForSale,
}: OfferDialogProps) {
  const isListDisabled = progressScore < 20;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full max-h-[100dvh] overflow-y-auto min-w-0 [overflow-wrap:anywhere]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <VisuallyHidden>
              <DialogTitle>Generating offer</DialogTitle>
              <DialogDescription>Analyzing your project data and activity</DialogDescription>
            </VisuallyHidden>
            <Loader2 className="size-8 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Generating your offer…</p>
              <p className="text-xs text-muted-foreground">
                Analyzing your project data and activity
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <VisuallyHidden>
              <DialogTitle>Error</DialogTitle>
              <DialogDescription>Failed to generate offer</DialogDescription>
            </VisuallyHidden>
            <AlertTriangle className="size-8 text-destructive" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Failed to generate offer</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <DialogFooter className="w-full">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Dismiss
              </Button>
            </DialogFooter>
          </div>
        ) : offer ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SparklesIcon className="size-5 text-primary" />
                Your Vamo Offer
              </DialogTitle>
              <DialogDescription>
                Based on your logged activity and project data
              </DialogDescription>
            </DialogHeader>

            {/* Offer range */}
            <div className="rounded-lg border bg-card p-4 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="size-4 text-green-500" />
                <span className="text-xs text-muted-foreground font-medium">
                  Estimated Offer Range
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight break-words">
                {formatCurrency(offer.offer_low)} –{" "}
                {formatCurrency(offer.offer_high)}
              </p>
            </div>

            {/* Reasoning */}
            <div className="space-y-2 min-w-0">
              <h4 className="text-sm font-semibold">Reasoning</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {offer.reasoning}
              </p>
            </div>

            {/* Signals used */}
            {offer.signals_used.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Signals Considered</h4>
                <div className="flex flex-wrap gap-1.5">
                  {offer.signals_used.map((signal, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      <CheckCircle2 className="size-3 mr-1" />
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground italic">
              This is a non-binding estimate based on your logged activity. Actual
              sale price may vary based on market conditions and buyer interest.
            </p>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <Button
                variant="outline"
                className="w-full sm:flex-1"
                onClick={() => onOpenChange(false)}
              >
                Dismiss
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full sm:flex-1" tabIndex={isListDisabled ? 0 : undefined}>
                      <Button
                        className="w-full"
                        disabled={isListDisabled}
                        onClick={() => {
                          onOpenChange(false);
                          onListForSale(offer.offer_low, offer.offer_high);
                        }}
                      >
                        List for Sale
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isListDisabled && (
                    <TooltipContent side="bottom">
                      Reach a progress score of 20 to unlock listing
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
