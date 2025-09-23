"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import clsx from "clsx";

const ManageSubscriptions = () => {
  const { subscriptions, loading } = useUserSubscriptions();
  const [search, setSearch] = useState("");

  const filtered = subscriptions.filter((s) => {
    const name = `${s.profiles?.first_name || ""} ${s.profiles?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase().trim());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Manage User Subscriptions</h1>
        <p className="text-muted-foreground">Overview of all user plans and statuses</p>
      </div>

      <div className="mx-auto mb-6">
        <Input
          placeholder="Search by user name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="p-4 text-center text-muted-foreground">Loading subscriptions...</div>
      ) : filtered.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">No subscriptions found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((sub) => (
            <Card key={sub.id} className="shadow-md border rounded-2xl hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {sub.profiles?.first_name} {sub.profiles?.last_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Plan:</span>
                  <span>{sub.plan?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Amount:</span>
                  <span>${sub.amount || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge
                    className={clsx(
                      "px-2 py-1 text-xs",
                      sub.status === "completed" ? "bg-green-500" : "bg-yellow-500"
                    )}
                  >
                    {sub.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Start Date:</span>
                  <span>
                    {sub.subscription_start
                      ? new Date(sub.subscription_start).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">End Date:</span>
                  <span>
                    {sub.subscription_end
                      ? new Date(sub.subscription_end).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageSubscriptions;
