import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export type Profile = Database['public']['Tables']['profiles']['Row'];

interface EmailInviteModalProps {
  open: boolean;
  onClose: () => void;
  onInviteResolved: (guestIds: string[]) => void;
  getInviteEmails: (emails: string[]) => void;
  subscriptionStatus: 'loading' | 'free' | 'premium'; // passed from parent
}

export const EmailInviteModal = ({ open, onClose, onInviteResolved, getInviteEmails, subscriptionStatus }: EmailInviteModalProps) => {
  const [emails, setEmails] = useState([""])
  const [errors, setErrors] = useState([])
  const [sending, setSending] = useState(false)
  const isFreeTier = subscriptionStatus === 'free';
  const navigate = useNavigate()

    const MAX_FREE_INVITES = 5;

  const handleEmailChange = (index: number, value: string) => {
    const updated = [...emails]
    updated[index] = value
    setEmails(updated)
  }

    const addEmailField = () => {
    if (emails[emails.length - 1].trim() === "") return;
        const nonEmptyEmails = emails.filter(email => email.trim() !== "");
    if (isFreeTier && emails.length >= MAX_FREE_INVITES) {
      toast({
        title: "Invite Limit Reached",
        description: "Free users can only invite up to 5 guests. Upgrade to invite more.",
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
    setSending(true)
    // setErrors([])

    const nonEmptyEmails = emails.map(e => e.trim()).filter(e => e !== "");

    if (nonEmptyEmails.length === 0) {
      toast({
        title: "No emails entered",
        description: "Please add at least one guest email before sending invites.",
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
      .in("email", emails)

    if (error) {
      console.error("Error fetching profiles:", error)
      toast({
        title: "Error",
        description: "Something went wrong while verifying emails.",
        variant: "destructive",
      });
      setSending(false)
      return
    }
    // const foundEmails = users.map(u => u.email)
    // const notFound = emails.filter(email => !foundEmails.includes(email))

    // if (notFound.length > 0) {
    //   setErrors(notFound)
    //   setSending(false)
    //   return
    // }
    const guestIds = users.map(u => u.id)
    onInviteResolved(guestIds) 
    
    // Getting all emails to send invites
    getInviteEmails(emails);
    setSending(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
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
              />
{idx === emails.length - 1 && (!isFreeTier || emails.length < MAX_FREE_INVITES) && (
  <Button onClick={addEmailField} variant="ghost">
    ➕
  </Button>
)}
              {emails.length > 1 && (
                <Button
                  onClick={() => removeEmailField(idx)}
                  variant="ghost"
                  className="text-red-500"
                >
                  ❌
                </Button>
              )}
            </div>
          ))}

          {isFreeTier && emails.filter(e => e.trim() !== "").length >= MAX_FREE_INVITES && (
            <div className="text-sm text-muted-foreground flex justify-between items-center border border-border p-2 rounded">
              <span>You’ve reached the free invite limit.</span>
              <Button
                onClick={() => navigate("/subscription")}
                variant="outline"
                className="text-xs"
              >
                Upgrade Plan
              </Button>
            </div>
          )}

          {errors.length > 0 && (
            <div className="text-red-500 text-sm">
              These emails are not signed up: {errors.join(", ")}
            </div>
          )}

          <Button disabled={sending} onClick={handleSubmit}>
            {sending ? "Sending..." : "Send Invitations"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
