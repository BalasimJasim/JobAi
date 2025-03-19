import { Types } from 'mongoose';
import { ApplicationModel } from '../models/application.model';
import { CreateApplicationRequest, UpdateApplicationStatusRequest, JobApplication } from '../types/application.types';

export class ApplicationService {
  private transformToJobApplication(doc: any): JobApplication {
    const { _id, ...rest } = doc.toObject();
    return {
      id: _id.toString(),
      ...rest
    };
  }

  async createApplication(data: CreateApplicationRequest): Promise<JobApplication> {
    const application = await ApplicationModel.create({
      ...data,
      status: data.status || 'DRAFT',
      appliedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    return this.transformToJobApplication(application);
  }

  async getApplications(userId: Types.ObjectId): Promise<JobApplication[]> {
    const applications = await ApplicationModel.find({ userId })
      .sort({ lastUpdated: -1 });
    return applications.map(app => this.transformToJobApplication(app));
  }

  async getApplicationById(id: string, userId: Types.ObjectId): Promise<JobApplication | null> {
    const application = await ApplicationModel.findOne({ _id: id, userId });
    return application ? this.transformToJobApplication(application) : null;
  }

  async updateApplicationStatus(
    id: string, 
    userId: Types.ObjectId,
    data: UpdateApplicationStatusRequest
  ): Promise<JobApplication | null> {
    const application = await ApplicationModel.findOneAndUpdate(
      { _id: id, userId },
      {
        ...data,
        lastUpdated: new Date().toISOString()
      },
      { new: true }
    );
    return application ? this.transformToJobApplication(application) : null;
  }

  async deleteApplication(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await ApplicationModel.deleteOne({ _id: id, userId });
    return result.deletedCount === 1;
  }

  async searchApplications(userId: Types.ObjectId, query: string): Promise<JobApplication[]> {
    const searchTerm = query.toLowerCase();
    const applications = await ApplicationModel.find({
      userId,
      $or: [
        { position: { $regex: searchTerm, $options: 'i' } },
        { company: { $regex: searchTerm, $options: 'i' } },
        { jobDescription: { $regex: searchTerm, $options: 'i' } }
      ]
    }).sort({ lastUpdated: -1 });
    return applications.map(app => this.transformToJobApplication(app));
  }
} 