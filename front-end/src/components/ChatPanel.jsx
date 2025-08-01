import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './loader.css'; // Ensure this CSS file exists
import videoData from '../utils/videoData.js';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';


const ChatPanel = ({ onClose, onBack, chatHistory, setChatHistory }) => {
    const [inputValue, setInputValue] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showQuickButtons, setShowQuickButtons] = useState(true);
    const [showLoader, setShowLoader] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(true);
    const [playingIndex, setPlayingIndex] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const emojiRef = useRef(null);
    const inputRef = useRef();
    const messagesEndRef = useRef(null);

    const [showMainMicroPhoneButton, setShowMainMicroPhoneButton] = useState(true);
    const [recording, setRecording] = useState(false);

    const idleTimeoutRef = useRef(null);
    const [idleWarningSent, setIdleWarningSent] = useState(false);

    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const quickAsk = [
        { question: 'How compensation and taxation works?', showText: 'Taxation/ Compensation' },
        { question: 'How to prepare for a locums assignment?', showText: 'Assignment Prep' },
        { question: 'Paying off medical school debt or how to pay off medical school debt', showText: 'Medical School Debt' }
    ];

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    const handleFullscreen = (index) => {
        const currentVideo = videoRef.current[index];
        if (currentVideo.requestFullscreen) {
            currentVideo.requestFullscreen();
        } else if (currentVideo.webkitRequestFullscreen) {
            currentVideo.webkitRequestFullscreen();
        } else if (currentVideo.msRequestFullscreen) {
            currentVideo.msRequestFullscreen();
        }

        // Optional: Ensure object-contain when fullscreen
        currentVideo.style.objectFit = 'contain';
    };
    const handlePlay = (index) => {
        const currentVideo = videoRef.current[index];

        // Pause all other videos
        videoRef.current.forEach((video, i) => {
            if (video && i !== index) {
                video.pause();
            }
        });

        if (currentVideo.paused) {
            currentVideo.play();
            setPlayingIndex(index);
            setShowPlayButton(false);
        }
    };

    const handlePause = (index) => {
        const currentVideo = videoRef.current[index];
        if (currentVideo && !currentVideo.paused) {
            currentVideo.pause();
            setPlayingIndex(null);
            setShowPlayButton(true);
        }
    };
    const startIdleTimer = () => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

        idleTimeoutRef.current = setTimeout(() => {
            if (!idleWarningSent) {
                setChatHistory((prev) => [
                    ...prev,
                    {
                        type: 'bot',
                        text: "Hey there! Still with me? Let me know if you have any more questions.",
                        link: '',
                        videoData: []
                    }
                ]);
                setIdleWarningSent(true);
            }
        }, 20000); // 20 seconds
    };

    const resetIdleTimerOnActivity = () => {
        setIdleWarningSent(false);
        startIdleTimer();
    };

    useEffect(() => {
        localStorage.clear();

        const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach((event) =>
            window.addEventListener(event, resetIdleTimerOnActivity)
        );

        startIdleTimer();

        return () => {
            events.forEach((event) =>
                window.removeEventListener(event, resetIdleTimerOnActivity)
            );
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        };
    }, []);

    const handleEmojiClick = (emojiData) => {
        setInputValue((prev) => prev + emojiData.emoji);
        setShowEmojiPicker(false);
        inputRef.current.focus();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const sendQuickQuestion = async (item) => {
        const { question, showText } = item;
        setChatHistory((prev) => [...prev, { type: 'user', text: showText, link: '', videoData: [] }]);
        setInputValue('');
        setShowQuickButtons(false);

        setTimeout(() => {
            setChatHistory((prev) => [...prev, { type: 'bot', text: 'Thinking...', link: '', videoData: [] }]);
        }, 300);

        try {
            const response = await fetch('http://localhost:8181/ask/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) throw new Error('Failed to send question');

            const data = await response.json();
            setShowLoader(false);

            setChatHistory((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((msg) => msg.type === 'bot' && msg.text === 'Thinking...');
                if (idx !== -1) {
                    updated[idx] = { type: 'bot', text: data.answer, link: data.source_urls };
                    updated[idx].videoData = getRelatedVideos(question);
                }

                if (updated.length > 4) {
                    updated.push({
                        type: 'bot',
                        text: 'Is there anything else I can help you with?',
                        link: '',
                        videoData: []
                    });
                }
                return updated;
            });
        } catch (err) {
            console.error('Quick question error:', err);
            setChatHistory((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((msg) => msg.type === 'bot' && msg.text === 'Thinking...');
                if (idx !== -1) updated[idx] = { type: 'bot', text: 'Error', link: '', videoData: [] };
                return updated;
            });
        }

        setIdleWarningSent(false);
        startIdleTimer();
    };

    const handleMicClick = () => {
        resetTranscript();
        setShowMainMicroPhoneButton(false);
        setShowPopup(showPopup ? false : true);
    }

    const sendQuestion = async (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';


        e.preventDefault();
        const question = inputValue.trim();
        if (!question) return;

        setChatHistory((prev) => [...prev, { type: 'user', text: question, link: '', videoData: [] }]);
        setInputValue('');
        setShowQuickButtons(false);

        setTimeout(() => {
            setChatHistory((prev) => [...prev, { type: 'bot', text: 'Thinking...', link: '', videoData: [] }]);
        }, 300);

        try {
            const response = await fetch('http://localhost:8181/ask/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) throw new Error('Failed to send question');

            const data = await response.json();
            setShowLoader(false);

            setChatHistory((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((msg) => msg.type === 'bot' && msg.text === 'Thinking...');
                if (idx !== -1) {
                    updated[idx] = { type: 'bot', text: data.answer, link: data.source_urls, videoData: getRelatedVideos(question) };
                    console.log('Video data:', updated[idx].videoData);
                    console.log(getRelatedVideos(question))
                }
                if (updated.length > 5) {
                    updated.push({
                        type: 'bot',
                        text: 'Is there anything else I can help you with?',
                        link: '',
                        videoData: []
                    });
                }
                setIdleWarningSent(false);
                startIdleTimer();
                return updated;
            });
        } catch (error) {
            console.error('Error sending question:', error);
            setChatHistory((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((msg) => msg.type === 'bot' && msg.text === 'Thinking...');
                if (idx !== -1) updated[idx] = { type: 'bot', text: 'Error', link: '', videoData: [] };
                return updated;
            });
        }
        debugger
        console.log('Chat history:', chatHistory);
    };

    const onRecord = () => {
        setRecording(!recording);
        if (!recording) {
            SpeechRecognition.stopListening();
        }
        listening ? SpeechRecognition.stopListening() : SpeechRecognition.startListening({ continuous: true });
    };

    const onOk = () => {
        setShowMainMicroPhoneButton(true);
        SpeechRecognition.stopListening();
        setInputValue(transcript);
        setShowPopup(false);
    };

    const getRelatedVideos = (question) => {
        const lowerQuestion = question.toLowerCase();
        return videoData.filter((video) => {
            return video.keyword.toLowerCase().split(',').some((keyword) =>
                lowerQuestion.includes(keyword.trim().replace('#', ''))
            );
        });
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);

        // Reset height to auto first to shrink when deleting text
        e.target.style.height = 'auto';

        // Set height to scrollHeight to expand as needed
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    return (
        <>
            <div className="w-80 h-[600px] rounded-xl shadow-xl overflow-hidden flex flex-col bg-white border border-gray-200 font-sans relative">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="text-gray-500 hover:text-gray-700 text-xl"
                            aria-label="Back"
                            type="button"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 32 32"
                                fill="currentColor"
                                className="h-6 w-6"
                                aria-hidden="true"
                                style={{ transform: 'scaleX(-1)' }}
                            >
                                <path d="M23.7,16.7l-6,6c-0.4,0.4-1,0.4-1.4,0c-0.4-0.4-0.4-0.9-0.1-1.3l0.1-0.1l4.3-4.3H10c-0.5,0-0.9-0.4-1-0.9L9,16 c0-0.5,0.4-0.9,0.9-1l0.1,0h10.6l-4.3-4.3c-0.4-0.4-0.4-0.9-0.1-1.3l0.1-0.1c0.4-0.4,0.9-0.4,1.3-0.1l0.1,0.1l6,6 C24.1,15.7,24.1,16.2,23.7,16.7L23.7,16.7z" />
                            </svg>
                        </button>
                    )}

                    <div className="flex items-center gap-2 bg-white rounded-full shadow px-3 py-1 border border-gray-200 mx-auto max-w-max">
                        <div className="relative w-9 h-9">
                            <div className="w-9 h-9 bg-custom-purple rounded-full flex items-center justify-center text-white text-xl">
                                <img
                                    src="/images/avatar-transparent.svg"
                                    alt="Avatar"
                                    className="rounded-full"
                                />
                            </div>
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                        </div>
                        <span className="font-semibold text-gray-800 select-none">Tom Botz</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 text-xl"
                        aria-label="Close"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3">
                    {/* Messages */}
                    <div className="space-y-3">
                        {chatHistory.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex items-start ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.type === 'bot' && (
                                    index === 1 ? (
                                        <div className="w-6 h-6 mr-2" />
                                    ) : (
                                        <div className="w-6 h-6 flex items-center justify-center text-custom-purple mr-2 mt-1">
                                            <img src='/images/avatar-transparent.svg' alt="Bot Avatar" className="rounded-full w-6 h-6" />
                                        </div>
                                    )
                                )}
                                <div
                                    className={`p-3 text-sm rounded-xl max-w-[75%] ${msg.type === 'user'
                                        ? 'bg-custom-purple text-white rounded-br-none'
                                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                        }`}
                                >
                                    {msg.text === 'Error' ? (
                                        <span className="text-red-500">An error occurred while processing your request.</span>
                                    ) : (
                                        <div>
                                            {msg.text === 'Thinking...' ? (
                                                <span class="wavy-dots">
                                                    <span>.</span><span>.</span><span>.</span>
                                                </span>
                                            ) : (
                                                <span>{msg.text}</span>
                                            )}
                                            <p>{msg.link && <a href={msg.link[0]} className="text-blue-500 hover:underline">click here to learn more</a>}</p>
                                            <p>{msg.link && <a href={msg.link[1]} className="text-blue-500 hover:underline">click here to learn more</a>}</p>
                                            <div className="flex flex-wrap gap-4">
                                                {msg.videoData.map((video, index) => (
                                                    <div
                                                        key={video.url}
                                                        className="relative rounded-md overflow-hidden cursor-pointer group"
                                                    >
                                                        <video
                                                            ref={(el) => {
                                                                if (!videoRef.current) videoRef.current = [];
                                                                videoRef.current[index] = el;
                                                            }}
                                                            className="w-full h-full rounded-md object-contain"
                                                            src={`/videos/${video.url}`}
                                                            onClick={() => handlePlay(index)}
                                                            controls={false}
                                                        />

                                                        {/* Play/Pause button */}
                                                        {playingIndex !== index ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePlay(index);
                                                                }}
                                                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                 bg-black bg-opacity-40 text-white text-xl rounded-full p-2 
                 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                aria-label="Play video"
                                                            >
                                                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePause(index);
                                                                }}
                                                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                 bg-black bg-opacity-40 text-white text-xl rounded-full p-2 
                 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                aria-label="Pause video"
                                                            >
                                                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        {/* Fullscreen Button (bottom right corner) */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFullscreen(index);
                                                            }}
                                                            className="absolute bottom-1 right-1 bg-black bg-opacity-40 text-white p-1 rounded-md 
               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                            aria-label="Fullscreen"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M7 14H5v5h5v-2H7v-3zm0-4h2V7h3V5H7v5zm10 4h-2v3h-3v2h5v-5zm-2-4V7h3V5h-5v2h2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                        {/* Quick Buttons */}
                        {showQuickButtons && (
                            <div className="grid grid-cols-2 gap-2 px-4 mt-2 mb-2">
                                {quickAsk.map((item, index) => (
                                    <button
                                        key={index}
                                        className="bg-custom-purple-300 text-custom-purple font-semibold 
               border-2 border-custom-yellow rounded-lg text-sm 
               py-1 transition duration-300 ease-in-out 
               hover:bg-custom-purple-200 hover:text-white 
               shadow-md hover:shadow-lg focus:outline-none 
               focus:ring-2 focus:ring-custom-yellow focus:ring-offset-2"
                                        onClick={() => {
                                            sendQuickQuestion(item);
                                        }}
                                    >
                                        {item.showText}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Box */}
                <div className="px-3 py-2 border-t">
                    <div className="relative w-full border rounded-md px-3 pt-2 pb-10">
                        <form className="flex flex-col w-full" onSubmit={sendQuestion}>
                            <textarea
                                ref={inputRef}
                                rows={1}
                                placeholder="Write a message..."
                                value={showPopup ? transcript : inputValue}
                                onChange={handleInputChange}
                                className="w-full resize-none outline-none text-sm scrollbar-hide pr-12"
                                style={{ minHeight: '40px', maxHeight: '120px', overflowY: 'auto' }}
                            />
                            {/* Buttons at the bottom-right */}
                            <div className="absolute bottom-2 right-3 flex items-center gap-2">
                                {/* Emoji Button */}
                                <button
                                    type="button"
                                    aria-label="Emoji Picker"
                                    ref={emojiRef}
                                    className="text-xl text-gray-500 hover:text-blue-600"
                                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-6 h-6"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M14.828 14.828a4 4 0 0 1-5.656 0m9.9-2.828a9 9 0 1 1-17.796 0 9 9 0 0 1 17.796 0ZM9 10h.01M15 10h.01"
                                        />
                                    </svg>
                                </button>

                                {/* Send Button */}
                                <button
                                    type="submit"
                                    className="text-3xl text-gray-500 hover:text-custom-yellow p-2"
                                    aria-label="Send"
                                >
                                    ➤
                                </button>

                                {/* Mic Button */}
                                {showMainMicroPhoneButton && (
                                    <button
                                        onClick={handleMicClick}
                                        type="button"
                                        className="w-8 h-8 bg-custom-purple hover:bg-custom-yellow text-white rounded-md flex items-center justify-center"
                                        title="Click to speak"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19.93V22h2v-2.07a8.001 8.001 0 0 0 6.928-6.928h-2.02A6.002 6.002 0 0 1 12 17a6.002 6.002 0 0 1-5.908-4.996H5.07A7.998 7.998 0 0 0 11 19.93z" />
                                        </svg>
                                    </button>
                                )}

                                {/* Popup */}
                                {showPopup && (
                                    <div className="fixed top-1/2 rounded-full right-20 w-60 bg-purple-800 px-4 py-3 flex justify-center items-center gap-8">
                                        {/* Reset Button */}
                                        <button
                                            type="button"
                                            className="text-white text-lg hover:text-yellow-400"
                                            aria-label="Reset"
                                            onClick={resetTranscript}
                                        >
                                            ↻
                                        </button>

                                        {/* Microphone Button */}
                                        <button
                                            type="button"
                                            onClick={onRecord}
                                            className={`w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-300
    ${recording ? 'bg-red-600 animate-ping-slow' : 'bg-custom-purple hover:bg-custom-yellow'}
  `}
                                            title="Click to speak"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-6 h-6"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19.93V22h2v-2.07a8.001 8.001 0 0 0 6.928-6.928h-2.02A6.002 6.002 0 0 1 12 17a6.002 6.002 0 0 1-5.908-4.996H5.07A7.998 7.998 0 0 0 11 19.93z" />
                                            </svg>
                                        </button>


                                        {/* OK Button */}
                                        <button
                                            type="button"
                                            className="text-white text-lg hover:text-yellow-400"
                                            aria-label="OK"
                                            onClick={onOk}
                                        >
                                            ✓
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
          <div className="text-center text-xs text-gray-400 pb-3 mt-auto">
            Powered by <strong className="text-purple-600">locumstory</strong>
          </div>
            </div>

            {/* Emoji Picker outside scroll container */}
            {showEmojiPicker && (
                <div className="absolute bottom-20 right-4 z-50 shadow-lg rounded-lg bg-white border border-gray-300">
                    <div className="flex justify-end p-2">
                        <button
                            onClick={() => setShowEmojiPicker(false)}
                            className="text-gray-500 hover:text-red-500 text-sm"
                            aria-label="Close Emoji Picker"
                        >
                            ✕
                        </button>
                    </div>
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
            )}
        </>
    );
};

export default ChatPanel;
