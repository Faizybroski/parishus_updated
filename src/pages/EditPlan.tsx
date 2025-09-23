import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePlans } from "@/hooks/usePlans";
import { toast } from "sonner";

const EditPlan = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPlanById, updatePlan } = usePlans();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    interval: "monthly",
  });

  const [errors, setErrors] = useState({
    name: "",
    description: "",
    price: "",
    interval: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the plan from backend directly using ID
  useEffect(() => {
    const fetchPlan = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const { data: plan, error } = await getPlanById(id);

        if (error || !plan) {
          toast.error("Plan not found or failed to load.");
          return navigate("/admin/plans");
        }

        setFormData({
          name: plan.name.trim() || "",
          description: plan.description.trim() || "",
          price: plan.price?.toString().trim() || "",
          interval: plan.interval.trim() || "monthly",
        });
      } catch (err) {
        toast.error("An unexpected error occurred while loading plan.");
        navigate("/admin/plans");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  const validate = () => {
    const newErrors = { name: "", description: "", price: "", interval: "" };
    if (!formData.name.trim()) newErrors.name = "Plan name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.price.trim()) newErrors.price = "Price is required";
    else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Enter a valid positive price";
    }
    if (!formData.interval) newErrors.interval = "Billing interval is required";
    setErrors(newErrors);
    return Object.values(newErrors).every((err) => err === "");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !id) return;

    setIsSubmitting(true);

    const { error } = await updatePlan(id, {
      ...formData,
      price: parseFloat(formData.price),
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || "Failed to update plan.");
      return;
    }

    toast.success(`Plan "${formData.name}" updated successfully.`);
    navigate("/admin/plans");
  };

  const handleCancel = () => {
    navigate("/admin/plans");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Plans</span>
          </Button>
          <h1 className="text-3xl font-bold">Edit Subscription Plan</h1>
          <p className="text-muted-foreground mt-2">
            Update your subscription pricing and details.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">
            Loading plan...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-card p-6 rounded-xl shadow-md"
          >
            <div>
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Basic, Pro, Premium"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Write a short plan summary..."
                value={formData.description}
                onChange={handleChange}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                type="number"
                id="price"
                name="price"
                placeholder="e.g. 29.99"
                value={formData.price}
                onChange={handleChange}
              />
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <Label htmlFor="interval">Billing Interval</Label>
              <select
                id="interval"
                name="interval"
                value={formData.interval}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select interval</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              {errors.interval && (
                <p className="text-sm text-red-500 mt-1">{errors.interval}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update Plan"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditPlan;
