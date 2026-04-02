import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updatePassword(password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "You can now log in with your new password.",
      });
      window.location.href = "/"; // Redirect to login
    }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h2 className="text-xl font-semibold mb-4">Reset Your Password</h2>
      <form onSubmit={handleUpdatePassword} className="space-y-4">
       <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value.trim())}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
