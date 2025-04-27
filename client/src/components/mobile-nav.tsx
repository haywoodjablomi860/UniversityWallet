
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Waypoints,
  LogOut,
  Wallet,
  ArrowUpRight,
  LayoutDashboard,
  Settings,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const baseNavigation = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Send", href: "/send", icon: ArrowUpRight },
  { name: "Cash", href: "/withdraw", icon: CreditCard },
  { name: "History", href: "/all-transactions", icon: Settings },
  { name: "Network", href: "/transaction-network", icon: Waypoints },
];

export function MobileNav() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navigation = [...baseNavigation];
  if (user?.isAdmin) {
    navigation.push({ name: "Admin", href: "/admin", icon: CreditCard });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
      <div className="grid grid-cols-6 gap-1 px-2 py-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[10px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              <Icon className="h-4 w-4 mb-0.5" />
              <span className="truncate w-full text-center">{item.name}</span>
            </Link>
          );
        })}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4 mb-0.5" />
          <span className="truncate w-full text-center">Logout</span>
        </Button>
      </div>
    </nav>
  );
}
