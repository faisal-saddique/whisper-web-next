'use client';

import AudioRecorder from '@/components/AudioRecorder';
import Progress from '@/components/Progress';
import Transcript from '@/components/Transcript';
import { useTranscriber } from '@/hooks/useTranscriber';
import { useState } from 'react';

export default function Home() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const transcriber = useTranscriber();

  // Handle recording completion and automatically start transcription
  const handleRecordingComplete = async (blob: Blob) => {
    setAudioBlob(blob);
    transcriber.reset();
    
    // Automatically start transcription
    const arrayBuffer = await blob.arrayBuffer();
    const audioCTX = new AudioContext({
      sampleRate: 16000, // Whisper expects 16kHz audio
    });
    
    try {
      const audioBuffer = await audioCTX.decodeAudioData(arrayBuffer);
      transcriber.start(audioBuffer);
    } catch (error) {
      console.error("Error decoding audio data:", error);
      alert("Failed to decode audio. Please try again with a different recording.");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center py-8">
      <h1 className="text-4xl font-extrabold mb-2 text-center">Whisper Web</h1>
      <h2 className="text-xl mb-8 text-center">ML-powered speech recognition directly in your browser</h2>
      
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        
        {transcriber.progressItems.length > 0 && (
          <div className="mt-4 w-full">
            <label className="text-sm text-gray-600">
              Loading model files... (only runs once)
            </label>
            {transcriber.progressItems.map((data) => (
              <div key={data.file}>
                <Progress
                  text={data.file}
                  percentage={data.progress}
                />
              </div>
            ))}
          </div>
        )}

        {transcriber.isBusy && (
          <div className="mt-4 w-full">
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
              <p className="font-bold">Transcribing...</p>
              <p>Please wait while we process your audio.</p>
            </div>
          </div>
        )}
      </div>
      
      <Transcript transcribedData={transcriber.output} />
    </main>
  );
}