'use client';

import { useState, useEffect, useRef } from "react";

// Helper function to format timestamps
function formatAudioTimestamp(time: number) {
  function padTime(time: number) {
    return String(time).padStart(2, "0");
  }
  
  const hours = Math.floor(time / (60 * 60));
  time -= hours * (60 * 60);
  const minutes = Math.floor(time / 60);
  time -= minutes * 60;
  const seconds = Math.floor(time);
  return `${hours ? padTime(hours) + ":" : ""}${padTime(minutes)}:${padTime(seconds)}`;
}

export default function AudioRecorder({ onRecordingComplete }: { 
  onRecordingComplete: (blob: Blob) => void 
}) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getMimeType = () => {
    const types = [
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
      "audio/wav",
      "audio/aac",
    ];
    for (let i = 0; i < types.length; i++) {
      if (MediaRecorder.isTypeSupported(types[i])) {
        return types[i];
      }
    }
    return undefined;
  };

  const startRecording = async () => {
    // Reset recording (if any)
    setRecordedBlob(null);

    let startTime = Date.now();

    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }

      const mimeType = getMimeType();
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
        if (mediaRecorder.state === "inactive") {
          const duration = Date.now() - startTime;

          // Create blob from chunks
          let blob = new Blob(chunksRef.current, { type: mimeType });
          
          setRecordedBlob(blob);
          onRecordingComplete(blob);
        }
      });
      
      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop(); // set state to inactive
      setDuration(0);
      setRecording(false);
    }
  };

  useEffect(() => {
    if (recording) {
      const timer = setInterval(() => {
        setDuration((prevDuration) => prevDuration + 1);
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [recording]);

  const handleToggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <button
        type="button"
        className={`m-2 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200 ${
          recording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }`}
        onClick={handleToggleRecording}
      >
        {recording
          ? `Stop Recording (${formatAudioTimestamp(duration)})`
          : "Start Recording"}
      </button>

      {recordedBlob && (
        <audio className="w-full mt-4" ref={audioRef} controls>
          <source
            src={URL.createObjectURL(recordedBlob)}
            type={recordedBlob.type}
          />
        </audio>
      )}
    </div>
  );
}