import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ApplicationTracker } from '@/components/application/ApplicationTracker';

export default function ApplicationsPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <ApplicationTracker />
      </div>
    </DashboardLayout>
  );
} 