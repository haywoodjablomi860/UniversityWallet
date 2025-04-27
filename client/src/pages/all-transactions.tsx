import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AllTransactions() {
  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/all-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/all-transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  // Helper to get date string in yyyy-MM-dd format from timestamp
  const getDateString = (timestamp: string | number) =>
    format(new Date(timestamp), "yyyy-MM-dd");

  // Filter transactions based on the provided filters
  const filteredTransactions = transactions.filter((tx) => {
    // Filter by name (sender or receiver)
    if (
      filterName &&
      !(
        (tx.senderName &&
          tx.senderName.toLowerCase().includes(filterName.toLowerCase())) ||
        (tx.receiverName &&
          tx.receiverName.toLowerCase().includes(filterName.toLowerCase()))
      )
    ) {
      return false;
    }
    // Filter by date: include transactions that are on or after the selected day
    if (filterDate && getDateString(tx.timestamp) < filterDate) {
      return false;
    }
    // Filter by minimum amount
    if (filterMinAmount && parseFloat(tx.amount) < parseFloat(filterMinAmount)) {
      return false;
    }
    // Filter by maximum amount
    if (filterMaxAmount && parseFloat(tx.amount) > parseFloat(filterMaxAmount)) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4 md:space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle>All Transactions</CardTitle>
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
          {/* Container with relative positioning for sticky header */}
          <div className="relative max-h-[400px] overflow-y-auto">
            <Table className="min-w-[600px]">
              <TableHeader style={{ position: "sticky" }}>
                <TableRow>
                  <TableHead className="bg-white">Date</TableHead>
                  <TableHead className="bg-white">Time</TableHead>
                  <TableHead className="bg-white">Sender</TableHead>
                  <TableHead className="bg-white">Receiver</TableHead>
                  <TableHead className="bg-white">Type</TableHead>
                  <TableHead className="bg-white">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {format(new Date(tx.timestamp), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(tx.timestamp), "HH:mm")}
                    </TableCell>
                    <TableCell>{tx.senderName || tx.senderId}</TableCell>
                    <TableCell>{tx.receiverName || tx.receiverId}</TableCell>
                    <TableCell className="capitalize">{tx.type}</TableCell>
                    <TableCell>${parseFloat(tx.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
