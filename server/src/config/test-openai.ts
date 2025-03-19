import { testOpenAIConnection, analyzeResume, generateSectionSuggestions } from '../utils/openai';

const testOpenAI = async () => {
  try {
    console.log('Testing OpenAI API integration...');

    // Test basic connection
    console.log('Testing API connection...');
    const isConnected = await testOpenAIConnection();
    console.log('✅ API Connection test:', isConnected ? 'Successful' : 'Failed');

    // Test resume analysis
    console.log('\nTesting resume analysis...');
    const sampleResume = `
    John Doe
    Software Engineer
    
    EXPERIENCE
    Senior Developer, Tech Corp
    - Led development of cloud-based applications
    - Managed team of 5 developers
    
    SKILLS
    JavaScript, Python, AWS
    `;

    const analysis = await analyzeResume(sampleResume);
    console.log('✅ Resume analysis successful');
    console.log('Score:', analysis.score);
    console.log('Feedback items:', analysis.feedback.length);
    console.log('Keywords found:', analysis.keywordAnalysis.found.length);

    // Test section suggestions
    console.log('\nTesting section suggestions...');
    const sectionContent = `
    EXPERIENCE
    Senior Developer, Tech Corp
    - Led development of cloud-based applications
    - Managed team of 5 developers
    `;

    const suggestions = await generateSectionSuggestions('EXPERIENCE', sectionContent);
    console.log('✅ Section suggestions generated');
    console.log('Number of suggestions:', suggestions.length);

    console.log('\nAll OpenAI integration tests completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('OpenAI integration test failed:', error);
    process.exit(1);
  }
};

// Run the test
testOpenAI(); 