import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SearchItem {
  label: string;
  path: string;
  type: "page" | "action" | "event";
  icon?: React.ElementType;
  keywords?: string[];
}

interface GlobalSearchBarProps {
  isVisible: boolean;
  onClose: () => void;
  navItems: SearchItem[];
  dynamicEvents?: { id: string; name: string }[];
  searchButtonRef?: React.RefObject<HTMLButtonElement>;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  isVisible,
  onClose,
  navItems,
  dynamicEvents = [],
  searchButtonRef,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedOutside =
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!searchButtonRef?.current ||
          !searchButtonRef.current.contains(target));

      if (clickedOutside) onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, searchButtonRef]);

  // Search logic
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    const allItems: SearchItem[] = [
      ...navItems,
      {
        label: "Create Event",
        keywords: ["create", "event", "add", "new event", "make event"],
        path: "/events-create",
        type: "action",
      },
      {
        label: "Add Restaurant",
        keywords: ["create", "restaurant", "add", "new restaurant"],
        path: "/restaurants/add",
        type: "action",
      },
      {
        label: "Wallet",
        keywords: ["cash", "withdraw", "accounts"],
        path: "/wallet/withdraw",
        type: "action",
      },
      {
        label: "Reservations",
        keywords: ["rsvps", "reserve", "reservation"],
        path: "/rsvps",
        type: "page",
      },
      {
        label: "Visits",
        keywords: ["visits", "history", "restaurants"],
        path: "/my-visits",
        type: "page",
      },
      {
        label: "Profile",
        keywords: ["me", "manage profile", "accounts"],
        path: "/profile",
        type: "page",
      },
      {
        label: "Browse Events",
        keywords: ["explore", "browse", "events", "discover"],
        path: "/explore",
        type: "page",
      },
      {
        label: "Subscriptions",
        keywords: ["manage", "subscriptions"],
        path: "/manage-subscriptions",
        type: "page",
      },
      {
        label: "Home",
        keywords: ["home", "dashboard", "main", "overview"],
        path: "/",
        type: "page",
      },
      {
        label: "User Dashboard",
        keywords: ["manage", "dashboard", "user"],
        path: "/manage-subscriptions",
        type: "page",
      },
      {
        label: "Refund Policy",
        keywords: ["policy", "refund", "cashback", "cash"],
        path: "/refund-policy",
        type: "page",
      },
      {
        label: "Contact",
        keywords: ["contact", "mail", "call"],
        path: "/contact-us",
        type: "page",
      },
      {
        label: "Safety Guidelines",
        keywords: ["safety", "policy", "privacy", "guidelines"],
        path: "/safety-guidelines",
        type: "page",
      },
      {
        label: "Terms and Conditions",
        keywords: ["terms", "conditions", "terms and conditions", "and"],
        path: "/terms-conditions",
        type: "page",
      },
      {
        label: "Privacy Policy",
        keywords: ["policy", "security", "safety", "privacy"],
        path: "/privacy-policy",
        type: "page",
      },
      ...dynamicEvents.map((e) => ({
        label: e.name,
        path: `/event/${e.id}/details`,
        type: "event",
      })),
    ];

    const filtered = allItems.filter((item) => {
      const search = query.toLowerCase();
      const inLabel = item.label.toLowerCase().includes(search);
      const inKeywords = item.keywords?.some((kw) =>
        kw.toLowerCase().includes(search)
      );
      return inLabel || inKeywords;
    });
    setResults(filtered);
  }, [query, navItems, dynamicEvents]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-16 bg-background border-b border-border z-40 shadow-sm"
    >
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything…"
            className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {query && (
            <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
              Clear
            </Button>
          )}
        </div>

        {results.length > 0 && (
          <Card className="mt-3 p-2 divide-y divide-border">
            {results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-secondary/30 rounded text-left"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {item.type}
                </span>
              </button>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
};

export default GlobalSearchBar;
