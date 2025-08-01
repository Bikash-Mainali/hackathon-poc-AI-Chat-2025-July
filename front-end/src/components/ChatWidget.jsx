import React, { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import videoData from '../utils/videoData';
import LocumLearningPanel from './LocumLearningPanel';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);

  const [chatHistory, setChatHistory] = useState(() => {
    const stored = localStorage.getItem('chatHistory');
    return stored ? JSON.parse(stored) : [
      { type: 'bot', text: 'Hello! How can I assist you today?', link: '', videoData: [] },
      { type: 'bot', text: 'Feel free to ask me anything!', link: '', videoData: [] },
    ];
  });

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const API_URL = 'http://localhost:8181/crawl';

  const handleOpenChat = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to start session');
      await response.json();
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setShowChatPanel(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <div className="relative group flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="hover:bg-custom-yellow text-white text-2xl p-3 rounded-full shadow-lg"
            aria-label="Open chat"
            type="button"
          >
            <img src="/images/avatar.svg" height={40} width={40} alt="Chat" className='animate-spin duration-[7000ms] hover:animate-none'/>
          </button>

          {/* Tooltip on the left */}
          <div
            className="absolute w-44 right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-white text-black text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity  z-10"
            style={{
              boxShadow:
                '0 1px 3px 0 var(--ds-elevation-shadow-default, rgba(0, 0, 0, 0.15)), 0 1px 2px -1px var(--ds-elevation-shadow-default, rgba(0, 0, 0, 0.15))',
            }}
          >
            Not sure where to start? I've got answers
          </div>
        </div>

      )}

      {isOpen && !showChatPanel && (
        <div className="w-80 rounded-custom shadow-xl overflow-hidden flex flex-col bg-purple-to-white border border-gray-200">
          <div className="p-4 flex justify-between items-start">
            <div className="flex flex-col items-start gap-3">
              <div>
                <img
                  src="/images/avatar-transparent.svg"
                  alt="Avatar"
                  className="rounded-full"
                />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 leading-snug text-2xl">How can we help you today?</h4>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-custom-purple-400 hover:text-white text-xl font-bold"
              aria-label="Close launcher"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2 px-4 mb-3">
            {[
              { label: "Frequently Asked Questions", href: "https://locumstory.com/locums-questions" },
              { label: "Browse All Podcasts", href: "https://open.spotify.com/show/19XB0IsqqC6CX3FJS1d9Oa" },

            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="w-full flex items-center justify-between bg-white py-3 px-4 rounded-md shadow hover:bg-gray-50 text-sm no-underline text-gray-800"
              >
                <span>{label}</span>
                <span>➔</span>
              </a>
            ))}
            <button
              onClick={() => {
                setShowVideoPanel(true);
                setIsOpen(false);
                setShowChatPanel(false);
              }}
              className="w-full flex items-center justify-between bg-white py-3 px-4 rounded-md shadow hover:bg-gray-50 text-sm no-underline text-gray-800"
            >
              <span>Browse All Videos</span>
              <span>➔</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-4 mx-4 mb-4">
            <div className="flex items-start mb-2">
              <div className="text-purple-600 p-2 rounded-full text-lg"><img src="/images/chatbot.svg" alt="Bot Avatar" className="rounded-full w-6 h-6" /></div>
              <div className="ml-3">
                <div className="font-semibold text-sm">TomBotz</div>
                <div className="text-xs text-gray-600">Let me know if you have any questions!</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleOpenChat}
                className="flex-grow bg-custom-purple text-white py-2 text-sm font-semibold rounded-md hover:bg-custom-yellow flex items-center justify-center gap-2"
                type="button"
              >
                Chat with us
              </button>

              {/* Mic button */}
              <button
                onClick={handleOpenChat}
                className="w-10 h-10 bg-custom-purple hover:bg-custom-yellow text-white rounded-md flex items-center justify-center ml-2"
                title="Click to speak"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19.93V22h2v-2.07a8.001 8.001 0 0 0 6.928-6.928h-2.02A6.002 6.002 0 0 1 12 17a6.002 6.002 0 0 1-5.908-4.996H5.07A7.998 7.998 0 0 0 11 19.93z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 pb-3 mt-auto">
            Powered by <strong className="text-purple-600">locumstory</strong>
          </div>
        </div>
      )}

      {showChatPanel && (
        <ChatPanel
          onClose={() => {
            setShowChatPanel(false);
            setIsOpen(false);
          }}
          onBack={() => {
            setShowChatPanel(false);
          }}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        />
      )}
      {showVideoPanel && (
        <div className="fixed bottom-6 right-6 z-50 w-[700px] max-h-[85vh] bg-white shadow-2xl rounded-xl overflow-hidden flex flex-col border border-gray-200">
          {/* Header with back/close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-800">All Locum Videos</h2>
            <button
              onClick={() => setShowVideoPanel(false)}
              className="text-gray-500 hover:text-gray-800 text-xl"
              aria-label="Close video panel"
            >
              ✕
            </button>
          </div>

          {/* Panel content scrollable */}
          <div className="overflow-y-auto px-4 py-3">
            <LocumLearningPanel onBack={() => {
              setShowVideoPanel(false);
              setShowChatPanel(false);
              setIsOpen(true); // optional, to reopen chat widget UI

            }} />
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatWidget;
