import axios from 'axios';

const testResumeAnalysis = async () => {
  try {
    console.log('Testing resume analysis endpoint...');
    
    const testData = {
      resumeText: `
        John Doe
        Software Engineer
        
        Experience:
        - Senior Developer at Tech Corp (2018-Present)
        - Full Stack Developer at StartUp Inc (2015-2018)
        
        Skills:
        - JavaScript, TypeScript, React, Node.js
        - AWS, Docker, MongoDB
        
        Education:
        - BS Computer Science, University of Technology
      `,
      jobDescription: `
        Looking for a Senior Software Engineer with:
        - 5+ years of experience in full-stack development
        - Strong knowledge of React and Node.js
        - Experience with cloud platforms (AWS preferred)
      `
    };

    const response = await axios.post('http://localhost:5000/api/resumes/analyze', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

  } catch (error: any) {
    console.error('Error testing resume analysis:', 
      error.response?.data || error.message || 'Unknown error'
    );
  }
};

// Run the test
testResumeAnalysis(); 