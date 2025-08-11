import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ErrorDialogProps {
  title: string;
  message: string;
  open: boolean;
  onClose: () => void;
  showResetPassword?: boolean;
  onResetPassword?: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  title,
  message,
  open,
  onClose,
  showResetPassword,
  onResetPassword,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent className="sm:max-w-[425px] border-2 border-destructive z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-destructive text-xl font-bold">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 text-lg font-medium text-center">{message}</div>
        <DialogFooter className="flex-col gap-3 sm:flex-col">
          {showResetPassword && (
            <Button
              type="button"
              variant="outline"
              className="w-full text-base py-2"
              onClick={onResetPassword}
            >
              Reset Password
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            className="w-full text-base py-2"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorDialog;
