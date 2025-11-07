import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Cross, Plus, X } from "lucide-react";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface EmailInviteModalProps {
  style: string;
  style_button: string;
  open: boolean;
  onClose: () => void;
  onInviteResolved: (guestIds: string[]) => void;
  getInviteEmails: (emails: string[]) => void;
  subscriptionStatus: "loading" | "free" | "premium"; // passed from parent
}

export const EmailInviteModal = ({
  style,
  style_button,
  open,
  onClose,
  onInviteResolved,
  getInviteEmails,
  subscriptionStatus,
}: EmailInviteModalProps) => {
  const [emails, setEmails] = useState([""]);
  const [errors, setErrors] = useState([]);
  const [sending, setSending] = useState(false);
  const isFreeTier = subscriptionStatus === "free";
  const navigate = useNavigate();

  const MAX_FREE_INVITES = 5;

  const handleEmailChange = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const addEmailField = () => {
    if (emails[emails.length - 1].trim() === "") return;
    const nonEmptyEmails = emails.filter((email) => email.trim() !== "");
    if (isFreeTier && emails.length >= MAX_FREE_INVITES) {
      toast({
        title: "Invite Limit Reached",
        description:
          "Free users can only invite up to 5 guests. Upgrade to invite more.",
        variant: "destructive",
      });
      return;
    }
    setEmails([...emails, ""]);
  };

  const removeEmailField = (index: number) => {
    const updated = emails.filter((_, i) => i !== index);
    setEmails(updated.length ? updated : [""]);
  };

  const handleSubmit = async () => {
    setSending(true);
    // setErrors([])

    const nonEmptyEmails = emails.map((e) => e.trim()).filter((e) => e !== "");

    if (nonEmptyEmails.length === 0) {
      toast({
        title: "No emails entered",
        description:
          "Please add at least one guest email before sending invites.",
        variant: "destructive",
      });
      setSending(false);
      return;
    }
    if (isFreeTier && nonEmptyEmails.length > MAX_FREE_INVITES) {
      toast({
        title: "Too Many Invites",
        description: `You're only allowed to invite ${MAX_FREE_INVITES} guests on the free plan.`,
        variant: "destructive",
      });
      setSending(false);
      return;
    }
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email")
      .in("email", emails);

    if (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Something went wrong while verifying emails.",
        variant: "destructive",
      });
      setSending(false);
      return;
    }
    // const foundEmails = users.map(u => u.email)
    // const notFound = emails.filter(email => !foundEmails.includes(email))

    // if (notFound.length > 0) {
    //   setErrors(notFound)
    //   setSending(false)
    //   return
    // }
    const guestIds = users.map((u) => u.id);
    onInviteResolved(guestIds);

    // Getting all emails to send invites
    getInviteEmails(emails);
    setSending(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]"
        style={style}
      >
        <DialogHeader>
          <DialogTitle>Invite Guests</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {emails.map((email, idx) => (
            <div key={idx} className="flex space-x-2 items-center">
              <Input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(idx, e.target.value.trim())}
                placeholder="Enter guest email"
                style={style}
              />
              {idx === emails.length - 1 &&
                (!isFreeTier || emails.length < MAX_FREE_INVITES) && (
                  <Button
                    onClick={addEmailField}
                    variant="ghost"
                    className="hover:bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              {emails.length > 1 && (
                <Button
                  onClick={() => removeEmailField(idx)}
                  variant="ghost"
                  className="text-red-500  hover:bg-transparent"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {isFreeTier &&
            emails.filter((e) => e.trim() !== "").length >=
              MAX_FREE_INVITES && (
              <div className="text-sm text-muted-foreground flex justify-between items-center border border-border p-2 rounded">
                <span>You’ve reached the free invite limit.</span>
                <Link to={"/subscription"}>
                  <Button
                    variant="outline"
                    className="text-xs"
                    style={style_button}
                  >
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            )}

          {errors.length > 0 && (
            <div className="text-red-500 text-sm">
              These emails are not signed up: {errors.join(", ")}
            </div>
          )}

          <DialogFooter>
            <Button
              disabled={sending}
              onClick={handleSubmit}
              style={style_button}
            >
              {sending ? "Sending..." : "Send Invitations"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
