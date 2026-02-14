"use client";

import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { BalanceCard } from "../components/balance-card";
import { RedeemDialog } from "../components/redeem-dialog";
import { WalletHistoryTable } from "../components/wallet-history-table";
import { useWallet } from "../hooks/use-wallet";

function WalletContent() {
  const {
    profile,
    tableData,
    profileLoading,
    tableLoading,
    error,
    tab,
    setTab,
    page,
    setPage,
    sortBy,
    setSortBy,
    perPage,
    minAmount,
    maxAmount,
    setMinAmount,
    setMaxAmount,
    redeem,
  } = useWallet();

  const [redeemOpen, setRedeemOpen] = useState(false);

  const balance = profile?.pineapple_balance ?? 0;

  const handleRedeem = async (amount: number, rewardType: string, projectId?: string) => {
    const result = await redeem(amount, rewardType, projectId);
    toast.success(result.message);
  };

  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-12 space-y-8">
      {/* Greeting */}
      <div>
        {profileLoading ? (
          <Skeleton className="h-9 w-64" />
        ) : (
          <h1 className="text-3xl font-bold tracking-tight">
            {profile?.full_name ? `Hey ${profile.full_name}` : "Your Wallet"}
          </h1>
        )}
        <p className="text-muted-foreground mt-1">
          Track your pineapple earnings and redeem rewards.
        </p>
      </div>

      {/* Balance Card */}
      {profileLoading ? (
        <Skeleton className="h-[160px] w-full rounded-xl" />
      ) : (
        <BalanceCard balance={balance} onRedeem={() => setRedeemOpen(true)} />
      )}

      {/* History Table — only this section re-renders on filter changes */}
      <WalletHistoryTable
        tab={tab}
        setTab={setTab}
        rewards={tableData.rewards}
        redemptions={tableData.redemptions}
        total={tableData.total}
        page={page}
        perPage={perPage}
        sortBy={sortBy}
        setSortBy={setSortBy}
        setPage={setPage}
        minAmount={minAmount}
        maxAmount={maxAmount}
        setMinAmount={setMinAmount}
        setMaxAmount={setMaxAmount}
        loading={tableLoading}
      />

      {/* Redeem Dialog */}
      <RedeemDialog
        open={redeemOpen}
        onOpenChange={setRedeemOpen}
        balance={balance}
        onConfirm={handleRedeem}
      />
    </div>
  );
}

export function WalletView() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1600px] mx-auto px-6 py-12 space-y-8">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-[160px] w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
