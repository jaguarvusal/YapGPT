import axios from 'axios';
export const analyzeTranscript = async (transcript) => {
    try {
        console.log('Starting GPT analysis for transcript:', transcript);
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are a speech coach analyzing a spoken transcript. Your task is to provide detailed feedback on the speaker's delivery.

IMPORTANT: You must respond with a valid JSON object in this exact format:
{
  "transcript": "the original transcript",
  "fillerWordCount": number,
  "confidenceScore": number between 0 and 1,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

For filler words, count EVERY instance of:
- "um", "uh", "er", "ah"
- "like", "you know", "sort of", "kind of"
- "basically", "actually", "literally"
- "so", "well", "right"
- "I mean", "I guess", "I think"

For confidence score:
- Score between 0 (low) and 1 (high)
- Consider clarity, pace, and filler word usage
- Be precise with decimal values

For suggestions:
- Give 3+ specific, actionable tips
- Focus on reducing filler words if many are detected
- Include specific examples from the transcript

DO NOT include any text outside the JSON object. The response must be valid JSON that can be parsed.`
                },
                {
                    role: 'user',
                    content: transcript
                }
            ],
            temperature: 0.3 // Lower temperature for more consistent counting
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Received GPT response:', response.data);
        // Get the content from the response
        const content = response.data.choices[0].message.content;
        console.log('Raw GPT content:', content);
        try {
            // Parse the response content as JSON
            const analysis = JSON.parse(content);
            console.log('Parsed analysis:', analysis);
            // Validate the required fields
            if (!analysis.transcript || typeof analysis.fillerWordCount !== 'number' ||
                typeof analysis.confidenceScore !== 'number' || !Array.isArray(analysis.suggestions)) {
                throw new Error('Invalid analysis format');
            }
            return analysis;
        }
        catch (parseError) {
            console.error('Error parsing GPT response:', parseError);
            console.error('Raw content that failed to parse:', content);
            throw new Error('Failed to parse GPT analysis');
        }
    }
    catch (error) {
        console.error('Error in GPT analysis:', error.response?.data || error);
        throw error;
    }
};
