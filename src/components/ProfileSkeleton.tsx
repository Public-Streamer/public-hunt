import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Profile Cover Skeleton */}
      <Card className="relative overflow-hidden">
        {/* Cover Photo Skeleton */}
        <div className="relative">
          <Skeleton className="h-48 md:h-64 w-full" />
          
          {/* Profile Picture Skeleton */}
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
            <div className="relative">
              <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-background" />
            </div>
          </div>
        </div>
        
        {/* Profile Info Skeleton */}
        <div className="p-4 md:p-6 pt-8 md:pt-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
              <Skeleton className="h-5 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-center">
              <Skeleton className="h-5 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-center">
              <Skeleton className="h-5 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      </Card>
      
      {/* Tabs Skeleton */}
      <div className="mt-6">
        <div className="border-b">
          <div className="flex space-x-8 px-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-16 mb-3" />
            ))}
          </div>
        </div>
        
        {/* Tab Content Skeleton */}
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;