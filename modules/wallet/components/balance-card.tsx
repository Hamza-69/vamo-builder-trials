"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BalanceCardProps {
  balance: number;
  onRedeem: () => void;
}

const MIN_REDEEM = 50;

export function BalanceCard({ balance, onRedeem }: BalanceCardProps) {
  const canRedeem = balance >= MIN_REDEEM;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-center justify-between gap-6 py-8">
        <div className="flex items-center gap-5">
          {/* Pineapple icon */}
          <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-4xl select-none">
            🍍
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Your Balance
            </p>
            <p className="text-4xl font-bold tracking-tight tabular-nums">
              {balance.toLocaleString()} <span className="text-2xl">🍍</span>
            </p>
          </div>
        </div>

        <Button
          size="lg"
          onClick={onRedeem}
          disabled={!canRedeem}
          className="shrink-0"
        >
          Redeem
        </Button>
      </CardContent>

      {!canRedeem && (
        <div className="px-6 pb-4 -mt-2">
          <p className="text-xs text-muted-foreground">
            You need at least {MIN_REDEEM} 🍍 to redeem rewards.
          </p>
        </div>
      )}
    </Card>
  );
}
