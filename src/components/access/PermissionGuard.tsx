import React from 'react';
import { useAccessControl } from '@/hooks/useAccessControl';
import LoadingSpinner from '@/components/ui/loading-spinner';
import AccessDenied from '@/components/AccessDenied';

interface PermissionGuardProps {
  eventId: string | null;
  requiredRole?: string | null;
  requiresTicket?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  eventId,
  requiredRole = null,
  requiresTicket = false,
  children,
  fallback,
}) => {
  const { hasAccess, isLoading, error, userRole } = useAccessControl(
    eventId,
    requiredRole,
    requiresTicket
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Access Error: {error}</p>
      </div>
    );
  }

  if (!hasAccess) {
    return fallback || <AccessDenied eventId={eventId} requiredRole={requiredRole} />;
  }

  return <>{children}</>;
};

export default PermissionGuard;
