'use client';

import { useState, useEffect, useRef } from "react";
import Script from "next/script";

export default function AudioRecorder({ onRecordingComplete }: { 
  onRecordingComplete: (blob: Blob) => void 
}) {
  const [recording, setRecording] = useState(false);
  const [audioMotionLoaded, setAudioMotionLoaded] = useState(false);
  const [audioMotionInstance, setAudioMotionInstance] = useState<any>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Initialize AudioMotion when the library is loaded
  useEffect(() => {
    if (audioMotionLoaded && containerRef.current && !audioMotionInstance) {
      try {
        const AudioMotionAnalyzer = (window as any).AudioMotionAnalyzer;
        if (AudioMotionAnalyzer) {
          const audioMotion = new AudioMotionAnalyzer(containerRef.current, {
            height: 200,
            width: containerRef.current.clientWidth,
            bgAlpha: 0,
            showScaleX: false,
            showPeaks: true,
            gradient: 'rainbow',
            showBgColor: true,
            mode: 10, // 10 is 'led bars' mode
            lumiBars: true,
            radial: false,
            reflexRatio: 0.3,
            fillAlpha: 0.7,
            lineWidth: 2
          });
          setAudioMotionInstance(audioMotion);
        }
      } catch (error) {
        console.error("Error initializing AudioMotion:", error);
      }
    }
  }, [audioMotionLoaded, audioMotionInstance]);

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

  // Setup audio visualization
  const setupVisualization = (stream: MediaStream) => {
    if (!audioMotionInstance) return;
    
    try {
      // Create audio context
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyzer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      // Connect stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      source.connect(analyser);
      
      // Connect to AudioMotion
      audioMotionInstance.connectInput(analyser);
    } catch (error) {
      console.error("Error setting up audio visualization:", error);
    }
  };

  const startRecording = async () => {
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }

      // Setup visualization if AudioMotion is loaded
      if (audioMotionLoaded && audioMotionInstance) {
        setupVisualization(streamRef.current);
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
          // Create blob from chunks
          let blob = new Blob(chunksRef.current, { type: mimeType });
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
      setRecording(false);

      // Disconnect and clean up audio context
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      
      if (audioMotionInstance) {
        audioMotionInstance.disconnectInput();
      }
    }
  };

  // Handle script load
  const handleScriptLoad = () => {
    setAudioMotionLoaded(true);
  };

  const handleToggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <Script 
        src="https://cdn.jsdelivr.net/npm/audiomotion-analyzer@3.6.1/dist/audioMotion-analyzer.min.js"
        onLoad={handleScriptLoad}
        strategy="afterInteractive"
      />

      <div className="flex flex-col items-center mb-4">
        <button
          type="button"
          className={`flex justify-center items-center w-16 h-16 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200 ${
            recording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
          onClick={handleToggleRecording}
        >
          {recording ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6z"/>
              <path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V22h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>
        {recording && <div className="mt-2 text-sm">Recording... Tap to stop</div>}
      </div>
      
      {/* Visualization container - always rendered but only active when recording */}
      <div 
        ref={containerRef} 
        className={`w-full h-48 bg-gray-100 rounded-lg overflow-hidden ${recording ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      ></div>
    </div>
  );
}