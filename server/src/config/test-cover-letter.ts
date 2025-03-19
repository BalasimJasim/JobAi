import dotenv from 'dotenv';
import { Types } from 'mongoose';
import { CoverLetterService } from '../services/cover-letter.service';
import { connectDatabase, disconnectDatabase } from './database';

// Load environment variables
dotenv.config();

const testCoverLetterGeneration = async () => {
  try {
    console.log('Testing Cover Letter Generation...');
    
    // Connect to database
    await connectDatabase();
    
    // Test data
    const request = {
      jobDescription: `
        Senior Software Engineer Position
        
        We are seeking a skilled Senior Software Engineer to join our team. The ideal candidate will have:
        - 5+ years of experience in full-stack development
        - Strong expertise in Node.js, TypeScript, and React
        - Experience with cloud technologies (AWS/Azure/GCP)
        - Track record of leading technical projects
        - Excellent problem-solving and communication skills
        
        Responsibilities:
        - Design and implement scalable web applications
        - Lead technical architecture decisions
        - Mentor junior developers
        - Collaborate with cross-functional teams
      `,
      keyPoints: [
        'Highlight cloud architecture experience',
        'Emphasize team leadership and mentoring',
        'Showcase full-stack development projects'
      ],
      companyName: 'TechCorp Solutions',
      position: 'Senior Software Engineer'
    };

    console.log('Generating cover letter...');
    const coverLetter = await CoverLetterService.generateCoverLetter(
      request,
      new Types.ObjectId()
    );

    console.log('✅ Cover letter generated successfully');
    console.log('\nCover Letter ID:', coverLetter.id);
    console.log('Content Length:', coverLetter.content.length);
    console.log('\nFirst 200 characters of content:');
    console.log(coverLetter.content.substring(0, 200) + '...');

    // Disconnect from database
    await disconnectDatabase();
    
    console.log('\nCover letter generation test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Cover letter generation test failed:', error);
    process.exit(1);
  }
};

// Run the test
testCoverLetterGeneration(); 