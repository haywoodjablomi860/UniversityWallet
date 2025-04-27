import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowUpRight, Wallet } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  // Helper to get date string in yyyy-MM-dd format from timestamp
  const getDateString = (timestamp: string | number) =>
    format(new Date(timestamp), "yyyy-MM-dd");

  // Filter transactions based on filters.
  const filteredTransactions = transactions.filter((tx) => {
    // Determine the displayed counterpart name: if current user is sender, show receiver; otherwise show sender.
    const counterpart =
      tx.senderId === user?.id ? tx.receiverName : tx.senderName;

    // Filter by name if provided.
    if (
      filterName &&
      (!counterpart ||
        !counterpart.toLowerCase().includes(filterName.toLowerCase()))
    ) {
      return false;
    }

    // Filter by date: include transactions on or after the filter date.
    if (filterDate && getDateString(tx.timestamp) < filterDate) {
      return false;
    }

    // Filter by minimum amount.
    if (filterMinAmount && parseFloat(tx.amount) < parseFloat(filterMinAmount)) {
      return false;
    }

    // Filter by maximum amount.
    if (filterMaxAmount && parseFloat(tx.amount) > parseFloat(filterMaxAmount)) {
      return false;
    }

    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4 md:space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wallet className="h-8 w-8 mr-2 text-primary" />
              <span className="text-2xl md:text-3xl font-bold">
                ${parseFloat(user?.balance || "0").toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:block">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button asChild className="flex-1">
              <Link href="/send">
                Send Money
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/withdraw">Withdraw</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle>Recent Transactions</CardTitle>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="p-1 border rounded hover:bg-gray-100"
              title="Toggle Filters"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 019 17v-3.586L3.293 6.707A1 1 0 013 6V4z"
                />
              </svg>
            </button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="p-1 border rounded text-xs"
              />
              <input
                type="date"
                placeholder="On or after"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="p-1 border rounded text-xs"
              />
              <input
                type="number"
                placeholder="Min amount"
                value={filterMinAmount}
                onChange={(e) => setFilterMinAmount(e.target.value)}
                className="p-1 border rounded text-xs w-24"
              />
              <input
                type="number"
                placeholder="Max amount"
                value={filterMaxAmount}
                onChange={(e) => setFilterMaxAmount(e.target.value)}
                className="p-1 border rounded text-xs w-24"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="relative max-h-[250px] overflow-y-auto">
            <Table className="min-w-[600px]">
              <TableHeader style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <TableRow>
                  <TableHead className="bg-white">Date</TableHead>
                  <TableHead className="bg-white">Time</TableHead>
                  <TableHead className="bg-white">Type</TableHead>
                  <TableHead className="bg-white">User</TableHead>
                  <TableHead className="bg-white">Amount</TableHead>
                  <TableHead className="bg-white">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => {
                  const counterpart =
                    tx.senderId === user?.id ? tx.receiverName : tx.senderName;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {format(new Date(tx.timestamp), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(tx.timestamp), "HH:mm")}
                      </TableCell>
                      <TableCell className="capitalize">{tx.type}</TableCell>
                      <TableCell>{counterpart}</TableCell>
                      <TableCell>
                        {tx.type === "deposit" ? (
                          <span className="text-green-500">
                            +${parseFloat(tx.amount).toFixed(2)}
                          </span>
                        ) : tx.type === "withdrawal" ? (
                          <span className="text-red-500">
                            -${parseFloat(tx.amount).toFixed(2)}
                          </span>
                        ) : (
                          <span
                            className={
                              tx.senderId === user?.id
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          >
                            {tx.senderId === user?.id ? "-" : "+"}$
                            {parseFloat(tx.amount).toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700">
                          Completed
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
