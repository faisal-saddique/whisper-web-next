'use client';

import AudioRecorder from '@/components/AudioRecorder';
import Progress from '@/components/Progress';
import Transcript from '@/components/Transcript';
import { useTranscriber } from '@/hooks/useTranscriber';
import { useState, useRef } from 'react';


export default function Home() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const transcriber = useTranscriber();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle recording completion
  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setAudioUrl(URL.createObjectURL(blob));
    transcriber.reset();
  };

  // Convert blob to AudioBuffer and start transcription
  const handleTranscribe = async () => {
    if (!audioBlob) return;
    
    const arrayBuffer = await audioBlob.arrayBuffer();
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
        
        {audioUrl && (
          <div className="mt-4 flex flex-col">
            <button
              onClick={handleTranscribe}
              disabled={transcriber.isBusy || transcriber.isModelLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {transcriber.isModelLoading 
                ? "Loading model..." 
                : transcriber.isBusy 
                  ? "Transcribing..." 
                  : "Transcribe Audio"}
            </button>
          </div>
        )}
        
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
      </div>
      
      <Transcript transcribedData={transcriber.output} />
    </main>
  );
}