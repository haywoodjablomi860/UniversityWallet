import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Search, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Send() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const transferMutation = useMutation({
    mutationFn: async (data: { receiverId: number; amount: string }) => {
      const res = await apiRequest("POST", "/api/transfer", data);
      return res.json();
    },
    onSuccess: (res) => {
      toast({
        title: "Transfer scheduled",
        description: (
          <span>
            ${amount} sent to {selectedUser?.fullName}.<br />
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
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase()),
  );

  const handleTransfer = () => {
    if (!selectedUser) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      receiverId: selectedUser.id,
      amount: amountNum.toFixed(2),
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Send Money</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Recipients</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or department"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredUsers.length > 0 && !selectedUser && (
            <div className="border rounded-md divide-y">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  className="w-full p-4 text-left hover:bg-muted flex items-center justify-between"
                  onClick={() => setSelectedUser(u)}
                >
                  <div>
                    <div className="font-medium">{u.fullName}</div>
                    <div className="text-sm text-muted-foreground">
                      {u.department}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <div className="font-medium">{selectedUser.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedUser.department}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedUser(null)}
                >
                  Change
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
                <div className="text-sm text-muted-foreground">
                  Available balance: ${parseFloat(user?.balance || "0").toFixed(2)}
                </div>
              </div>

              <Button
                className="w-full h-12 text-lg"
                onClick={handleTransfer}
                disabled={transferMutation.isPending}
              >
                Send Money
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}