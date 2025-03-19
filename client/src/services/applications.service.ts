import { getSession } from 'next-auth/react';

export interface Application {
  _id: string;
  userId: string;
  company: string;
  position: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'saved';
  dateApplied: string;
  notes?: string;
  jobDescription?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  salary?: string;
  location?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export class ApplicationsService {
  private static instance: ApplicationsService;
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '/api';

  private constructor() {}

  static getInstance(): ApplicationsService {
    if (!ApplicationsService.instance) {
      ApplicationsService.instance = new ApplicationsService();
    }
    return ApplicationsService.instance;
  }

  async getApplications(): Promise<Application[]> {
    try {
      const session = await getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${this.baseUrl}/applications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  }

  async getApplication(id: string): Promise<Application> {
    try {
      const session = await getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${this.baseUrl}/applications/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch application: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching application ${id}:`, error);
      throw error;
    }
  }

  async createApplication(applicationData: Partial<Application>): Promise<Application> {
    try {
      const session = await getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${this.baseUrl}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create application: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  async updateApplication(id: string, applicationData: Partial<Application>): Promise<Application> {
    try {
      const session = await getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${this.baseUrl}/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update application: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating application ${id}:`, error);
      throw error;
    }
  }

  async deleteApplication(id: string): Promise<void> {
    try {
      const session = await getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${this.baseUrl}/applications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete application: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting application ${id}:`, error);
      throw error;
    }
  }
} 