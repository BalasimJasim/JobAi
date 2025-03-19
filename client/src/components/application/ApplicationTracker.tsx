'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { ApplicationForm } from './ApplicationForm';
import { ApplicationList } from './ApplicationList';
import { useToast } from '@/components/ui/use-toast';
import { Application, ApplicationService } from '@/services/applications.service';

export function ApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Application['status'] | 'all'>('all');
  const { toast } = useToast();
  const applicationService = ApplicationService.getInstance();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await applicationService.getApplications();
      setApplications(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    }
  };

  const handleAddApplication = async (newApplication: Omit<Application, 'id'>) => {
    try {
      const data = await applicationService.createApplication(newApplication);
      setApplications(prev => [...prev, data]);
      setIsFormOpen(false);
      
      toast({
        title: 'Success',
        description: 'Application added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add application',
        variant: 'destructive',
      });
    }
  };

  const filteredApplications = applications
    .filter(app => 
      (statusFilter === 'all' || app.status === statusFilter) &&
      (searchQuery === '' || 
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Application Tracker</CardTitle>
              <CardDescription className="text-blue-100">
                Track and manage your job applications
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Application['status'] | 'all')}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <ApplicationList 
            applications={filteredApplications}
            onUpdate={async (updatedApp) => {
              try {
                const data = await applicationService.updateApplication(updatedApp.id, updatedApp);
                setApplications(prev => 
                  prev.map(app => app.id === data.id ? data : app)
                );
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'Failed to update application',
                  variant: 'destructive',
                });
              }
            }}
            onDelete={async (id) => {
              try {
                await applicationService.deleteApplication(id);
                setApplications(prev => prev.filter(app => app.id !== id));
                toast({
                  title: 'Success',
                  description: 'Application deleted successfully',
                });
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'Failed to delete application',
                  variant: 'destructive',
                });
              }
            }}
          />
        </CardContent>
      </Card>

      {isFormOpen && (
        <ApplicationForm
          onSubmit={handleAddApplication}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
} 