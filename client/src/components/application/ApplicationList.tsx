'use client';

import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Application } from '@/services/applications.service';
import { ApplicationForm } from './ApplicationForm';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';

interface ApplicationListProps {
  applications: Application[];
  onUpdate: (application: Application) => void;
  onDelete: (id: string) => void;
}

export function ApplicationList({ applications, onUpdate, onDelete }: ApplicationListProps) {
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    onDelete(id);
  };

  const getStatusColor = (status: Application['status']) => {
    const colors = {
      saved: 'bg-gray-100 text-gray-800',
      applied: 'bg-blue-100 text-blue-800',
      interview: 'bg-yellow-100 text-yellow-800',
      offer: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.saved;
  };

  const getPriorityColor = (priority: Application['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.medium;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {applications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No applications found. Add your first application to get started!
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {applications.map((application) => (
            <div
              key={application.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{application.jobTitle}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{application.company}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingApplication(application)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(application.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {application.url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(application.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(application.priority)}`}>
                  {application.priority.charAt(0).toUpperCase() + application.priority.slice(1)} Priority
                </span>
                {application.dateApplied && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Applied: {formatDate(application.dateApplied)}
                  </span>
                )}
              </div>

              {application.nextStep && (
                <div className="mt-3 text-sm">
                  <span className="font-medium">Next Step:</span> {application.nextStep}
                </div>
              )}

              {application.notes && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {application.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingApplication && (
        <ApplicationForm
          initialData={editingApplication}
          onSubmit={async (updatedData) => {
            onUpdate({
              ...updatedData,
              id: editingApplication.id,
              jobTitle: updatedData.jobTitle,
              company: updatedData.company,
              status: updatedData.status,
              dateApplied: updatedData.dateApplied,
              priority: updatedData.priority
            });
            setEditingApplication(null);
          }}
          onClose={() => setEditingApplication(null)}
        />
      )}
    </div>
  );
} 