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
  "grammarScore": number between 0 and 100,
  "wordChoiceScore": number between 0 and 100,
  "conciseness": {
    "wordCount": number,
    "sentenceCount": number
  },
  "charismaScore": number between 0 and 10,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

TEST CASES - These examples MUST be handled correctly:
1. "I like cheeseburgers so much so that my name is Delta" -> fillerWordCount: 0
   (Both "like" and "so" are meaningful, not fillers)
2. "Like, I was thinking about going to the store" -> fillerWordCount: 1
   ("Like" is a filler at the start)
3. "So, what happened was..." -> fillerWordCount: 1
   ("So" is a filler at the start)
4. "I think it's so hot outside" -> fillerWordCount: 0
   (Both "think" and "so" are meaningful)

DEFINITION OF FILLER WORDS:
A word is ONLY a filler word if it is:
1. Used as a pause/hesitation
2. Used at the start of a sentence/phrase without adding meaning
3. Used to buy time while thinking

A word is NOT a filler word if it:
1. Contributes to the meaning of the sentence
2. Is used in the middle of a sentence
3. Is part of a meaningful phrase

SPECIFIC WORD RULES:
1. "like":
   - FILLER: "Like, I was thinking..." (at start)
   - NOT FILLER: "I like pizza" (expressing preference)
   - NOT FILLER: "It looks like rain" (comparing)

2. "so":
   - FILLER: "So, what happened was..." (at start)
   - NOT FILLER: "It's so hot" (showing degree)
   - NOT FILLER: "so much so that" (showing consequence)

3. "um", "uh", "er", "ah":
   - ALWAYS FILLERS

4. "you know", "sort of", "kind of":
   - FILLER: "You know, it's like..." (at start)
   - NOT FILLER: "It's kind of cold" (expressing uncertainty)

5. "basically", "actually", "literally":
   - FILLER: "Basically, what I'm saying..." (at start)
   - NOT FILLER: "That's actually true" (emphasizing)

6. "well", "right":
   - FILLER: "Well, I guess..." (at start)
   - NOT FILLER: "You're right" (agreeing)

7. "I mean", "I guess", "I think":
   - FILLER: "I mean, like..." (at start)
   - NOT FILLER: "I think we should go" (expressing opinion)

For grammar score (0-100):
- Check for proper sentence structure
- Verify subject-verb agreement
- Look for correct tense usage
- Check for proper punctuation
- Consider sentence complexity and variety
- Score based on overall grammatical correctness

For word choice score (0-100):
- Evaluate vocabulary diversity
- Check for appropriate word usage
- Consider precision and clarity
- Look for natural language flow
- Score based on overall word choice quality

For conciseness:
- Count total words
- Count number of sentences
- Consider sentence length and complexity

For charisma score (0-10):
- Evaluate engagement level
- Check for natural flow
- Consider emotional impact
- Look for personal connection
- Score based on overall charisma

For confidence score:
- Score between 0 (low) and 1 (high)
- Consider clarity, pace, and filler word usage
- Be precise with decimal values

For suggestions:
- ALWAYS provide at least 3 suggestions, even for perfect responses
- For perfect responses, suggest ways to make it even better
- Focus on reducing filler words if many are detected
- Include specific examples from the transcript
- Consider grammar, word choice, and delivery
- Make suggestions specific and actionable
- If no issues found, suggest advanced techniques to enhance the speech

DO NOT include any text outside the JSON object. The response must be valid JSON that can be parsed.`
                },
                {
                    role: 'user',
                    content: transcript
                }
            ],
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Received GPT response:', response.data);
        const content = response.data.choices[0].message.content;
        console.log('Raw GPT content:', content);
        try {
            const analysis = JSON.parse(content);
            console.log('Parsed analysis:', analysis);
            if (!analysis.transcript ||
                typeof analysis.fillerWordCount !== 'number' ||
                typeof analysis.confidenceScore !== 'number' ||
                !Array.isArray(analysis.suggestions) ||
                typeof analysis.grammarScore !== 'number' ||
                typeof analysis.wordChoiceScore !== 'number' ||
                !analysis.conciseness ||
                typeof analysis.conciseness.wordCount !== 'number' ||
                typeof analysis.conciseness.sentenceCount !== 'number' ||
                typeof analysis.charismaScore !== 'number') {
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
