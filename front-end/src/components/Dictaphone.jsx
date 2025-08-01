import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const Dictaphone = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <textarea
        rows={4}
        value={transcript}
        readOnly
        placeholder="Your speech will appear here..."
        className="w-full border p-2 rounded mb-4"
      />
      <div className="flex gap-2">
        <button
          onClick={() => listening ? SpeechRecognition.stopListening() : SpeechRecognition.startListening({ continuous: true })}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {listening ? 'Stop' : 'Start'}
        </button>
        <button
          onClick={resetTranscript}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Reset
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600">Microphone: {listening ? 'On' : 'Off'}</p>
    </div>
  );
};

export default Dictaphone;
