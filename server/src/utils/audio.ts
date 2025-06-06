import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
fs.ensureDirSync(uploadsDir);

export const saveBase64ToFile = async (base64String: string, filename: string): Promise<string> => {
  console.log('Saving base64 audio to file...');
  // Remove the data URL prefix if present
  const base64Data = base64String.replace(/^data:audio\/\w+;base64,/, '');
  const filePath = path.join(uploadsDir, filename);
  
  // Convert base64 to buffer and write to file
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(filePath, buffer);
  console.log('Audio file saved successfully');
  
  return filePath;
};

export const transcribeAudio = async (filePath: string): Promise<string> => {
  console.log('Starting audio transcription for file:', filePath);
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath), {
    filename: 'audio.webm',
    contentType: 'audio/webm'
  });
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'json');
  formData.append('language', 'en');

  try {
    console.log('Sending request to OpenAI Whisper API...');
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    console.log('Received response from OpenAI Whisper:', response.data);
    return response.data.text;
  } catch (error: any) {
    console.error('Error in transcription:', error.response?.data || error.message);
    throw error;
  }
};

export const cleanupFile = async (filePath: string): Promise<void> => {
  try {
    console.log('Cleaning up file:', filePath);
    await fs.remove(filePath);
    console.log('File cleanup successful');
  } catch (error) {
    console.error('Error cleaning up file:', error);
    throw error;
  }
}; 