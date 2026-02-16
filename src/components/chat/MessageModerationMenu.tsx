import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, ShieldAlert, Clock, Trash2, Ban } from 'lucide-react';
import { Button } from "@/components/ui/button";

export type ModerationAction = 'ban' | 'timeout' | 'delete';

interface MessageModerationMenuProps {
    messageId: string;
    userId: string;
    userName: string;
    onAction: (action: ModerationAction, userId: string, messageId: string, duration?: number) => void;
}

export const MessageModerationMenu: React.FC<MessageModerationMenuProps> = ({
    messageId,
    userId,
    userName,
    onAction,
}) => {
    const [showBanConfirm, setShowBanConfirm] = React.useState(false);

    const handleAction = (action: ModerationAction, duration?: number) => {
        if (action === 'ban') {
            setShowBanConfirm(true);
        } else {
            onAction(action, userId, messageId, duration);
        }
    };

    const confirmBan = () => {
        onAction('ban', userId, messageId);
        setShowBanConfirm(false);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4 text-white/70" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-white">
                    <DropdownMenuLabel>Moderation Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />

                    <DropdownMenuItem onClick={() => handleAction('timeout', 300)} className="text-yellow-400 focus:text-yellow-400 focus:bg-zinc-800 cursor-pointer">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Timeout (5 min)</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleAction('timeout', 3600)} className="text-yellow-500 focus:text-yellow-500 focus:bg-zinc-800 cursor-pointer">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Timeout (1 hour)</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleAction('delete')} className="text-orange-400 focus:text-orange-400 focus:bg-zinc-800 cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Message</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-zinc-800" />

                    <DropdownMenuItem onClick={() => handleAction('ban')} className="text-red-500 focus:text-red-500 focus:bg-zinc-800 cursor-pointer">
                        <Ban className="mr-2 h-4 w-4" />
                        <span>Ban User</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showBanConfirm} onOpenChange={setShowBanConfirm}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            Ban User?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to ban <span className="font-bold text-white">{userName}</span>?
                            This will remove them from the stream and hide all their messages. This action can be undone later from the dashboard.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBan} className="bg-red-600 text-white hover:bg-red-700">Ban User</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
