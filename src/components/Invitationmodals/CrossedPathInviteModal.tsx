import {
    Dialog,
    DialogContent,
    DialogHeader, 
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/components/ui/use-toast"; 
import { useNavigate } from "react-router-dom"; 

interface Profile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string;
}

interface CrossedPathInviteModalProps {
    open: boolean;
    onClose: () => void;
    onInviteResolved: (guestIds: string[]) => void;
    subscriptionStatus: 'loading' | 'free' | 'premium';
}

export const CrossedPathInviteModal = ({ open, onClose, onInviteResolved, subscriptionStatus }: CrossedPathInviteModalProps) => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const { profile } = useProfile();
    const isFreeTier = subscriptionStatus === "free";
    const navigate = useNavigate();

    useEffect(() => {
        if (open && profile) {
            fetchCrossedPathUsers();
        }
    }, [open, profile]);

    const fetchCrossedPathUsers = async () => {
        setLoading(true);

        try {
            // 1. Fetch from crossed_paths_log
            const { data: logs, error: logError } = await supabase
            .from("crossed_paths_log")
            .select("user_a_id, user_b_id")
            .or(`user_a_id.eq.${profile?.user_id},user_b_id.eq.${profile?.user_id}`);

            if (logError) throw logError;

            // 2. Fetch from crossed_path
            const { data: altLogs, error: altError } = await supabase
            .from("crossed_paths")
            .select("user1_id, user2_id")
            .or(`user1_id.eq.${profile?.user_id},user2_id.eq.${profile?.user_id}`);

            if (altError) throw altError;

            // 3. Combine user IDs from both tables
            const idsFromLogs = logs?.flatMap((log) => {
                const ids: string[] = [];
                if (log.user_a_id !== profile?.user_id) ids.push(log.user_a_id);
                if (log.user_b_id !== profile?.user_id) ids.push(log.user_b_id);
                return ids;
            }) ?? [];

            const idsFromAltLogs = altLogs?.flatMap((log) => {
                const ids: string[] = [];
                if (log.user1_id !== profile?.user_id) ids.push(log.user1_id);
                if (log.user2_id !== profile?.user_id) ids.push(log.user2_id);
                return ids;
            }) ?? [];

            // 4. Combine and deduplicate
            const uniqueUserIds = [...new Set([...idsFromLogs, ...idsFromAltLogs])];

            if (uniqueUserIds.length === 0) {
                setUsers([]);
                return;
            }

            // 5. Fetch profiles for the unique user IDs
            const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, profile_photo_url")
            .in("user_id", uniqueUserIds);

            if (profileError || !profiles) {
                console.error("Error fetching user profiles:", profileError);
                setUsers([]);
            } else {
                setUsers(profiles);
            }
        } catch (err) {
            console.error("Error fetching crossed path users:", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // const toggleUserSelection = (userId: string) => {
    // setSelectedIds((prev) =>
    //     prev.includes(userId)
    //     ? prev.filter((id) => id !== userId) 
    //     : [...prev, userId] 
    // );
    // };

    const toggleUserSelection = (userId: string) => {
        const alreadySelected = selectedIds.includes(userId);

        if (!alreadySelected) {
            if (isFreeTier && selectedIds.length >= 5) {
                toast({
                title: "Invite Limit Reached",
                description: "Free users can only invite up to 5 guests. Upgrade to invite more.",
                variant: "destructive",
                });
                return;
            }
            setSelectedIds([...selectedIds, userId]);
        } else {
            setSelectedIds(selectedIds.filter((id) => id !== userId));
        }
    };

    const handleSubmit = () => {
        onInviteResolved(selectedIds);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Invite from Crossed Paths</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {loading ? (
                <p className="text-muted-foreground">Loading...</p>
            ) : users.length === 0 ? (
                <p className="text-muted-foreground">No crossed paths available</p>
            ) : (
                users.map((user) => {
                const isSelected = selectedIds.includes(user.id);
                return (
                    <Button
                        key={user.user_id}
                        variant="ghost"
                        className={`w-full justify-start p-2 rounded-lg flex items-center gap-3 border transition-all ${
                            isSelected
                            ? "bg-primary text-white border-primary"
                            : "hover:bg-muted border-border"
                        }`}
                        onClick={() => toggleUserSelection(user.id)}
                        >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profile_photo_url} />
                            <AvatarFallback>
                            {user.first_name?.[0]}
                            {user.last_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                            {user.first_name} {user.last_name}
                        </span>
                    </Button>

                );
                })
            )}
            </div>
            {isFreeTier && selectedIds.length >= 5 && (
                <div className="text-xs text-muted-foreground pt-2 flex justify-between items-center">
                    <span>You’ve reached your invite limit.</span>
                    <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/subscription")}
                    >
                    Upgrade
                    </Button>
                </div>
                )}

            <div className="pt-4 flex justify-end">
            <Button
                disabled={selectedIds.length === 0 || loading}
                onClick={handleSubmit}
            >
                Invite {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
            </Button>
            </div>
        </DialogContent>
        </Dialog>
    );
};
