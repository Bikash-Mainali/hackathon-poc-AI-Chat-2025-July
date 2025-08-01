import React, { useEffect, useState } from "react";
import ChatPanel from "./ChatPanel";

const videoData = [
  {
    title: "What I Wish I Knew Before My First Locums Assignment",
    doctor: "Dr. Emmett Matthews · Internal Medicine · Arizona",
    quote: "Ask questions early — from EMR to parking. Small details make a big difference.",
    tags: ["#GettingStarted", "#Onboarding", "#EMR", "#Logistics"],
    thumbnail: "/videos/drMatthews.mp4",
  },
  {
    title: "Why I Chose Locums Work",
    doctor: "Dr. Andrea Hope · Anesthesiology · Colorado",
    quote: "Locums gave me space to breathe again. It reminded me why I started medicine.",
    tags: ["#CareerChange", "#Motivation", "#Flexibility"],
    thumbnail: "/videos/drHope.mp4",
  },
  {
    title: "How Pay Works with Locums",
    doctor: "Dr. Arja Waltz · Emergency Medicine · Texas",
    quote: "Most locums pay per shift or per hour — but remember, it’s all 1099.",
    tags: ["#Pay", "#1099", "#Compensation", "#Rates"],
    thumbnail: "/videos/drWaltz.mp4",
  },
  {
    title: "Balancing Locums with My Personal Life",
    doctor: "Dr. John Andrade · Hospitals · Oregon",
    quote: "I schedule months in advance — that’s how I build in rest and family time.",
    tags: ["#Lifestyle", "#Flexibility", "#Scheduling", "#Burnout"],
    thumbnail: "/videos/drAndrade.mp4",
  },
  {
    title: "Handling Taxes & Benefits as a Locum",
    doctor: "Dr. Fatima Khan · OB-GYN · New York",
    quote: "I treat it like a business: separate account, CPA, and 401(k). It works.",
    tags: ["#Taxes", "#1099", "#Retirement", "#FinancialPlanning"],
    thumbnail: "/videos/drKhan.mp4",
  },
];

const LocumLearningPanel = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
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
    const handleFullscreenChange = () => {
      const videos = document.querySelectorAll("video");
      videos.forEach((video) => {
        if (
          document.fullscreenElement === video ||
          document.webkitFullscreenElement === video
        ) {
          video.classList.remove("object-cover");
          video.classList.add("object-contain");
        } else {
          video.classList.remove("object-contain");
          video.classList.add("object-cover");
        }
      });
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  // Extract unique tags for dropdown options
  const allTags = videoData
    .flatMap((video) => video.tags)
    .filter((tag, i, arr) => arr.indexOf(tag) === i);

  // Filter videos by selected tag/category
  const filteredVideos =
    selectedCategory === "all"
      ? videoData
      : videoData.filter((video) => video.tags.includes(selectedCategory));

  return (
    <div>
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
      <div className="p-2 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">
            Considering Locums? Learn from those who’ve done it.
          </h1>
          <p className="text-gray-600 mt-1">
            Explore real stories, tips, and answers from physicians who’ve worked
            locums.
          </p>
        </div>

        {/* Category Filter Dropdown */}
        <div className="mb-4 flex justify-center">
          <label
            htmlFor="category-select"
            className="mr-2 font-semibold text-gray-800 text-sm"
          >
            Categories:
          </label>
          <select
            id="category-select"
            className="border border-gray-300 rounded px-3 py-1 text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Recently Uploaded</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag.replace(/^#/, "")}
              </option>
            ))}
          </select>
        </div>

        {/* Video Cards */}
        <div className="flex overflow-x-auto gap-4 pb-4">
          {filteredVideos.map((video, index) => (
            <div
              key={index}
              className="min-w-[220px] max-w-[220px] bg-white rounded-lg shadow-md overflow-hidden relative group"
            >
              {/* Video */}
              <div className="relative w-full h-36">
                <video
                  src={video.thumbnail.trim()}
                  className="w-full h-full object-cover transition-all"
                  controls
                  muted
                  loop
                  playsInline
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => e.currentTarget.pause()}
                />
                {/* Play icon overlay */}
                <div className="absolute top-2 right-2 bg-custom-purple bg-opacity-50 text-white p-1 rounded-full group-hover:opacity-0 transition-opacity">
                  ▶
                </div>
              </div>

              {/* Title below video, above doctor */}
              <div className="bg-black bg-opacity-60 text-white text-xs font-medium px-2 py-1 whitespace-normal break-words">
                {video.title}
              </div>

              {/* Metadata */}
              <div className="p-3">
                <p className="text-xs text-gray-500">{video.doctor}</p>
                <p className="text-xs text-gray-600 mt-2">"{video.quote}"</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {video.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-purple-600 bg-purple-100 px-1 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          ))}
          {filteredVideos.length === 0 && (
            <p className="text-gray-500 p-4">No videos found for this category.</p>
          )}
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between items-center gap-6 mt-4 w-full max-w-6xl mx-auto">
          {/* Left: Bottom Links */}
          <div className="flex flex-col gap-2 w-full max-w-xl">
            {[
              { label: "Frequently Asked Questions", href: "/faq" },
              { label: "View all Articles", href: "/articles" },
              { label: "Locum Tenens Crash Course", href: "/crash-course" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="w-full flex items-center justify-between bg-white py-3 px-4 rounded-md shadow hover:bg-gray-50 text-sm text-gray-800"
              >
                <span>{label}</span>
                <span>➔</span>
              </a>
            ))}
          </div>

          {/* Right: Chat Widget */}
          <div
            className="flex flex-col justify-center items-start max-w-xs w-full p-3"
            style={{
              boxShadow: "0 1px 3px 0 var(--ds-elevation-shadow-default, rgba(0, 0, 0, 0.15)), 0 1px 2px -1px var(--ds-elevation-shadow-default, rgba(0, 0, 0, 0.15))"
            }}
          >            <div className="flex items-center gap-2 mb-3">
              <img
                src="/images/chatbot.svg"
                alt="Bot"
                className="w-6 h-6 rounded-full"
              />
              <div className="text-gray-900 m-0 text-xs font-normal">
                <p className="text-gray-400 text-xs">TomBotz</p>
                <p className="text-sm  font-medium">Let me know if you have any specific questions!</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => {
                  setShowChatPanel(true);
                }}
                className="flex-grow bg-custom-purple text-white text-sm px-4 py-2 rounded hover:bg-custom-yellow whitespace-nowrap h-10 flex items-center justify-center"
              >
                Chat with us
              </button>
              <button
                className="w-10 h-10 bg-custom-purple hover:bg-custom-yellow text-white rounded-md flex items-center justify-center"
                title="Click to speak"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19.93V22h2v-2.07a8.001 8.001 0 0 0 6.928-6.928h-2.02A6.002 6.002 0 0 1 12 17a6.002 6.002 0 0 1-5.908-4.996H5.07A7.998 7.998 0 0 0 11 19.93z" />
                </svg>
              </button>

            </div>
          </div>
        </div>
        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <strong className="text-purple-600">locumstory</strong>
        </p>
      </div>
      {showChatPanel && (
        <ChatPanel
          onClose={() => {
            setShowChatPanel(false);
            setIsOpen(false);
          }}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        />
      )}
    </div>
  );
};

export default LocumLearningPanel;
