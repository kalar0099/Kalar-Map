import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Map, List, PlusCircle, Compass, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk, useUser, Show } from "@clerk/react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const navItems = [
    { href: "/", label: "نەخشە", icon: Map },
    { href: "/places", label: "شوێنەکان", icon: List },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-l border-border bg-sidebar flex-shrink-0 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Compass size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary tracking-wide">نەخشەی کەلار</h1>
            <p className="text-xs text-muted-foreground">کەلار، کفری، رزگاری</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <span className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-all cursor-pointer font-medium",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                  <Icon size={20} className={isActive ? "text-primary" : "text-muted-foreground"} />
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Add new place — only for signed-in users */}
          <Show when="signed-in">
            <Link href="/places/new">
              <span className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all cursor-pointer font-medium",
                location === "/places/new"
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <PlusCircle size={20} className={location === "/places/new" ? "text-primary" : "text-muted-foreground"} />
                شوێنی نوێ
              </span>
            </Link>
          </Show>
        </nav>

        {/* User section at bottom */}
        <div className="px-4 py-4 border-t border-border">
          <Show when="signed-in">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                <User size={16} />
                <span className="truncate">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all cursor-pointer font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut size={20} className="text-muted-foreground" />
                دەرچوون
              </button>
            </div>
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in">
              <span className="flex items-center gap-3 px-4 py-3 rounded-md transition-all cursor-pointer font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <LogIn size={20} className="text-muted-foreground" />
                چوونەژوورەوە
              </span>
            </Link>
          </Show>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {children}
      </main>
    </div>
  );
}
