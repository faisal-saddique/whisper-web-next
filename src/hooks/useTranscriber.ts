'use client';

import { useCallback, useState, useEffect, useRef } from "react";

interface ProgressItem {
  file: string;
  loaded: number;
  progress: number;
  total: number;
  name: string;
  status: string;
}

type TranscriptChunk = {
  text: string;
  timestamp: [number, number | null];
};

interface TranscriptData {
  isBusy: boolean;
  text: string;
  chunks: TranscriptChunk[];
}

interface Transcriber {
  isBusy: boolean;
  isModelLoading: boolean;
  progressItems: ProgressItem[];
  start: (audioData: AudioBuffer | undefined) => void;
  reset: () => void;
  output?: TranscriptData;
}

export function useTranscriber(): Transcriber {
  const [transcript, setTranscript] = useState<TranscriptData | undefined>(undefined);
  const [isBusy, setIsBusy] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  
  const workerRef = useRef<Worker | null>(null);

  // Initialize the worker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Create the worker
    const worker = new Worker(new URL('/worker.js', window.location.origin), {
      type: 'module'
    });
    
    // Set up message handler
    worker.addEventListener('message', (event) => {
      const message = event.data;
      
      switch (message.status) {
        case "progress":
          // Model file progress: update one of the progress items.
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === message.file) {
                return { ...item, progress: message.progress };
              }
              return item;
            })
          );
          break;
        case "update":
          // Received partial update
          setTranscript({
            isBusy: true,
            text: message.data[0],
            chunks: message.data[1].chunks,
          });
          break;
        case "complete":
          // Received complete transcript
          setTranscript({
            isBusy: false,
            text: message.data.text,
            chunks: message.data.chunks,
          });
          setIsBusy(false);
          break;
        case "initiate":
          // Model file start load: add a new progress item to the list.
          setIsModelLoading(true);
          setProgressItems((prev) => [...prev, message]);
          break;
        case "ready":
          setIsModelLoading(false);
          break;
        case "error":
          setIsBusy(false);
          alert(
            `${message.data.message} This is most likely because you are using Safari on an M1/M2 Mac. Please try again from Chrome, Firefox, or Edge.\n\nIf this is not the case, please file a bug report.`
          );
          break;
        case "done":
          // Model file loaded: remove the progress item from the list.
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== message.file)
          );
          break;
        default:
          break;
      }
    });
    
    workerRef.current = worker;
    
    // Clean up worker when component unmounts
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    setTranscript(undefined);
  }, []);

  const postRequest = useCallback(async (audioData: AudioBuffer | undefined) => {
    if (!audioData || !workerRef.current) return;
    
    setTranscript(undefined);
    setIsBusy(true);

    let audio;
    if (audioData.numberOfChannels === 2) {
      const SCALING_FACTOR = Math.sqrt(2);

      let left = audioData.getChannelData(0);
      let right = audioData.getChannelData(1);

      audio = new Float32Array(left.length);
      for (let i = 0; i < audioData.length; ++i) {
        audio[i] = SCALING_FACTOR * (left[i] + right[i]) / 2;
      }
    } else {
      // If the audio is not stereo, we can just use the first channel:
      audio = audioData.getChannelData(0);
    }

    workerRef.current.postMessage({
      audio,
      model: "Xenova/whisper-tiny.en",
      quantized: true
    });
  }, []);

  return {
    isBusy,
    isModelLoading,
    progressItems,
    start: postRequest,
    reset,
    output: transcript
  };
}