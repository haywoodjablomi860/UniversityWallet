import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Waypoints,
  LogOut,
  Wallet,
  ArrowUpRight,
  LayoutDashboard,
  Settings,
  CreditCard  // or any icon for admin funds
} from "lucide-react";
import { Link, useLocation } from "wouter";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Send Money", href: "/send", icon: ArrowUpRight },
  { name: "Withdraw", href: "/withdraw", icon: CreditCard },
  { name: "All Transactions", href: "/all-transactions", icon: Settings },
  { name: "Network View", href: "/transaction-network", icon: Waypoints },
];

export function SidebarNav() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar border-r">
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <Wallet className="h-6 w-6" />
        <span className="font-semibold">University Wallet</span>
      </div>

      <div className="flex-1 px-4 space-y-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.name}
              variant={location === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                location === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : ""
              )}
              asChild
            >
              <Link href={item.href}>
                <Icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          );
        })}
        {/* New Admin-only navigation item */}
        {user?.isAdmin && (
          <Button
            key="Admin Funds"
            variant={location === "/admin" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              location === "/admin"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : ""
            )}
            asChild
          >
            <Link href="/admin">
              <CreditCard className="mr-2 h-4 w-4" />
              Admin Funds
            </Link>
          </Button>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="mb-4">
          <div className="font-medium">{user?.fullName}</div>
          <div className="text-sm text-muted-foreground">{user?.department}</div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
