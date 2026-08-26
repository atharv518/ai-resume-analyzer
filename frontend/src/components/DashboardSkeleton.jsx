import React from "react";

function SkeletonCard({ className = "", children }) {
  return (
    <div
      className={`glass-card rounded-xl p-5 border border-outline-variant/20 relative overflow-hidden animate-pulse ${className}`}
    >
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8 sm:pb-12">
      {/* Sub-header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 animate-pulse">
        <div className="h-6 w-48 bg-surface-variant/20 rounded-lg"></div>
        <div className="flex gap-2">
          <div className="h-6 w-32 bg-surface-variant/20 rounded-full"></div>
          <div className="h-6 w-36 bg-surface-variant/20 rounded-full"></div>
        </div>
      </div>

      {/* Masonry Skeleton Grid */}
      <div className="columns-1 lg:columns-2 gap-4 sm:gap-6">
        {/* Candidate Profile Skeleton */}
        <SkeletonCard className="mb-4 sm:mb-6">
          <div className="h-3 w-24 bg-surface-variant/20 rounded mb-2"></div>
          <div className="h-6 w-48 bg-surface-variant/30 rounded mb-3"></div>
          <div className="h-4 w-full bg-surface-variant/15 rounded mb-4"></div>
          <div className="space-y-2 pt-3 border-t border-outline-variant/15">
            <div className="h-3 w-40 bg-surface-variant/20 rounded"></div>
            <div className="h-3 w-32 bg-surface-variant/20 rounded"></div>
          </div>
        </SkeletonCard>

        {/* ATS Score Gauge Skeleton */}
        <SkeletonCard className="mb-4 sm:mb-6 flex flex-col items-center">
          <div className="w-full flex justify-between mb-4">
            <div className="h-5 w-36 bg-surface-variant/30 rounded"></div>
            <div className="h-5 w-24 bg-surface-variant/20 rounded-full"></div>
          </div>
          <div className="w-36 h-36 rounded-full border-8 border-surface-variant/20 flex items-center justify-center my-4">
            <div className="h-8 w-16 bg-surface-variant/30 rounded"></div>
          </div>
          <div className="w-full space-y-3 pt-3 border-t border-outline-variant/15">
            <div className="h-3 w-full bg-surface-variant/20 rounded"></div>
            <div className="h-3 w-full bg-surface-variant/20 rounded"></div>
          </div>
        </SkeletonCard>

        {/* AI Job Match Skeleton */}
        <SkeletonCard className="mb-4 sm:mb-6">
          <div className="h-5 w-44 bg-surface-variant/30 rounded mb-3"></div>
          <div className="h-16 w-full bg-surface-variant/15 rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-24 bg-surface-variant/20 rounded-lg"></div>
            <div className="h-24 bg-surface-variant/20 rounded-lg"></div>
          </div>
        </SkeletonCard>

        {/* Skills Comparison Skeleton */}
        <SkeletonCard className="mb-4 sm:mb-6">
          <div className="h-5 w-40 bg-surface-variant/30 rounded mb-3"></div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 w-20 bg-surface-variant/25 rounded-md"></div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
