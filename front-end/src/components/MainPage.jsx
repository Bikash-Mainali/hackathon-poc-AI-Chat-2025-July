import React, { useState } from "react";
import LocumLearningPanel from "./LocumLearningPanel";
import ChatWidget from "./ChatWidget";

const MainPage = () => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <LocumLearningPanel openChat={() => setChatOpen(true)} />
      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} />
    </>
  );
};

export default MainPage;
