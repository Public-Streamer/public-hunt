import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  onResetPassword
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-lg">
          {message}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {showResetPassword && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onResetPassword}
            >
              Reset Password
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            className="w-full"
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