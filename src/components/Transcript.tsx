'use client';

import { useRef } from "react";

type TranscriptChunk = {
  text: string;
  timestamp: [number, number | null];
};

interface TranscriptData {
  isBusy: boolean;
  text: string;
  chunks: TranscriptChunk[];
}

interface Props {
  transcribedData: TranscriptData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const exportTXT = () => {
    let chunks = transcribedData?.chunks ?? [];
    let text = chunks
      .map((chunk) => chunk.text)
      .join("")
      .trim();

    const blob = new Blob([text], { type: "text/plain" });
    saveBlob(blob, "transcript.txt");
  };
  
  const exportJSON = () => {
    let jsonData = JSON.stringify(transcribedData?.chunks ?? [], null, 2);

    // post-process the JSON to make it more readable
    const regex = /(    "timestamp": )\[\s+(\S+)\s+(\S+)\s+\]/gm;
    jsonData = jsonData.replace(regex, "$1[$2 $3]");

    const blob = new Blob([jsonData], { type: "application/json" });
    saveBlob(blob, "transcript.json");
  };

  if (!transcribedData) {
    return null;
  }

  // Combine all chunks into a single text
  const combinedText = transcribedData.chunks
    .map(chunk => chunk.text)
    .join("")
    .trim();

  return (
    <div
      ref={divRef}
      className="w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto"
    >
      {combinedText && (
        <div className="w-full mb-2 bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10">
          <div>{combinedText}</div>
        </div>
      )}
      
      {transcribedData && !transcribedData.isBusy && transcribedData.chunks.length > 0 && (
        <div className="w-full text-right mt-4">
          <button
            onClick={exportTXT}
            className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center"
          >
            Export TXT
          </button>
          <button
            onClick={exportJSON}
            className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center"
          >
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
}