import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { useProfile } from "@/hooks/useProfile";
import clsx from "clsx";

const Plans = () => {
  const { deletePlan, plans, loading } = usePlans();
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const navigate = useNavigate();

  const handleDelete = async (planId: number, planName: string) => {
    const confirmDelete = confirm(`Are you sure you want to delete the plan "${planName}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await deletePlan(planId.toString());
      if (error) throw error;

      toast.success(`The plan "${planName}" has been deleted.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete plan.");
    }
  };

  const filteredPlans = plans
    .filter((plan) => plan.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    .filter((plan) =>
      activeTab === "monthly"
        ? plan.interval === "month"
        : plan.interval === "year"
    );

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your pricing and subscription tiers</p>
        </div>

        <Button onClick={() => navigate("/admin/plans/add")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Button
          variant={activeTab === "monthly" ? "default" : "outline"}
          onClick={() => setActiveTab("monthly")}
        >
          Monthly
        </Button>
        <Button
          variant={activeTab === "yearly" ? "default" : "outline"}
          onClick={() => setActiveTab("yearly")}
        >
          Yearly
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search plans by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading plans...</div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No plans found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPlans.map((plan) => (
            <Card
              key={plan.id}
              className={clsx(
                "relative border rounded-lg shadow-md p-6 transition-all bg-card",
                plan.best_value && "border-yellow-400"
              )}
            >
              {plan.best_value && (
                <Badge className="absolute top-2 right-2 bg-yellow-400 text-black font-semibold">
                  ⚡ Best Value
                </Badge>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground mb-2">{plan.description || "No description provided."}</p>

                <h2 className="text-2xl font-bold mb-2">
                  ${plan.price}
                  <span className="text-sm font-medium text-muted-foreground">
                    /{plan.interval}
                  </span>
                </h2>

                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                  <li>Unlimited event creation</li>
                  <li>Premium event access</li>
                  <li>Advanced matching algorithm</li>
                  <li>Priority customer support</li>
                  <li>Exclusive member events</li>
                  <li>Enhanced profile visibility</li>
                </ul>

                <div className="flex justify-between items-center">
                  <Button variant="default"
                    onClick={() => handleDelete(plan.id, plan.name)} className="w-full">
                    <Trash2 className="h-4 w-4" /> Delete Plan
                  </Button>
                </div>

                <div className="flex justify-end mt-3 gap-2">
                  {/* <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/admin/plans/edit/${plan.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button> */}
                  {/* <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(plan.id, plan.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button> */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Plans;
