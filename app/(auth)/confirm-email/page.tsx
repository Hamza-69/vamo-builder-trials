import { Suspense } from "react";
import { ConfirmEmailContent } from "./content";
import { Loader2 } from "lucide-react";

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
