import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth"; // <-- Import your auth hook

interface UserData {
  id: number;
  fullName: string;
  department: string;
  balance: string;
}

const formatBalance = (balance: string): string => parseFloat(balance).toFixed(2);

const AdminFunds: React.FC = () => {
  const queryClient = useQueryClient();
  const [amountToAdd, setAmountToAdd] = useState<string>("");
  const { user } = useAuth(); // get the current logged-in user

  // Fetch current user data (instead of hardcoding id 1)
  const { data: adminData, isLoading, error } = useQuery<UserData>({
    queryKey: ["adminAccount", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/user/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch admin details");
      return res.json();
    },
    enabled: !!user,
  });

  // Mutation to update current user's balance
  const updateBalanceMutation = useMutation<any, Error, string>({
    mutationFn: (newAmount: string) => {
      return fetch("/api/admin/master-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the current user's id instead of 1
        body: JSON.stringify({ userId: user?.id, amount: newAmount }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update balance");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAccount", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const handleAddFunds = () => {
    if (amountToAdd.trim() === "") return;
    updateBalanceMutation.mutate(amountToAdd);
    setAmountToAdd("");
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Admin Funds Section */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Funds</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error.message}</p>
          ) : (
            <p className="mb-2">Current Balance: ${formatBalance(adminData?.balance || "0")}</p>
          )}
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Amount to add"
              value={amountToAdd}
              onChange={(e) => setAmountToAdd(e.target.value)}
              className="w-40"
            />
            <Button onClick={handleAddFunds}>Add Funds</Button>
          </div>
        </CardContent>
      </Card>

      {/* Manage User Roles Section */}
      <ManageUserRoles queryClient={queryClient} />
    </div>
  );
};

interface ManageUserRolesProps {
  queryClient: ReturnType<typeof useQueryClient>;
}

const ManageUserRoles: React.FC<ManageUserRolesProps> = ({ queryClient }) => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch all users (except the current user)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Filter users by search term (using fullName and department)
  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  // Mutation to promote a user to admin
  const promoteUserMutation = useMutation<any, Error, number, unknown>({
    mutationFn: async (userId: number) => {
      const res = await fetch("/api/admin/promote-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to promote user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Mutation to demote an admin to a normal user
  const demoteUserMutation = useMutation<any, Error, number, unknown>({
    mutationFn: async (userId: number) => {
      const res = await fetch("/api/admin/demote-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to demote user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const isMutationLoading =
    promoteUserMutation.status === "pending" || demoteUserMutation.status === "pending";

  const handleToggleAdmin = () => {
    if (!selectedUser) return;
    if (selectedUser.isAdmin) {
      demoteUserMutation.mutate(selectedUser.id);
    } else {
      promoteUserMutation.mutate(selectedUser.id);
    }
    setSelectedUser(null);
    setSearch("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage User Roles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Users</label>
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
                  <div className="text-sm text-muted-foreground">{u.department}</div>
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
                <div className="text-sm text-muted-foreground">{selectedUser.department}</div>
                <div className="text-sm text-muted-foreground">
                  Current Role: {selectedUser.isAdmin ? "Admin" : "Normal User"}
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                Change
              </Button>
            </div>
            <Button onClick={handleToggleAdmin} disabled={isMutationLoading}>
              {selectedUser.isAdmin ? "Demote to Non-Admin" : "Promote to Admin"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminFunds;
