import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const Withdraw: React.FC = () => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  const withdrawMutation = useMutation<any, Error, string>({
    mutationFn: (amount: string) => {
      return fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      }).then((res) => {
        if (!res.ok) throw new Error("Withdraw failed");
        return res.json();
      });
    },
    onSuccess: (res, amount) => {
      toast({
        title: "Withdrawal scheduled",
        description: (
          <span>
            ${parseFloat(amount || "0").toFixed(2)} will be withdrawn.
            <br />
            {res.txHash && (
              <>
                View on{" "}
                <a
                  href={`https://your-explorer.com/tx/${res.txHash}`}
                  className="underline"
                  target="_blank"
                >
                  Explorer
                </a>
              </>
            )}
          </span>
        ),
      });

      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setWithdrawAmount("");
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWithdraw = () => {
    if (withdrawAmount.trim() === "") return;
    withdrawMutation.mutate(withdrawAmount);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="text-sm text-muted-foreground mt-2">
            Available balance: ${parseFloat(user?.balance || "0").toFixed(2)}
          </div>

          <Button onClick={handleWithdraw} className="mt-4 w-full">
            Withdraw
          </Button>

          {withdrawMutation.isError && (
            <p className="text-red-500">Error: {withdrawMutation.error?.message}</p>
          )}
          {withdrawMutation.isSuccess && (
            <p className="text-green-500">Withdrawal successful!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Withdraw;