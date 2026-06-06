// Savoré — MascotChef Orchestrator Component

import React from 'react';
import ChefSpeechBubble from './ChefSystem/ChefSpeechBubble';
import ChefInteractionLayer from './ChefSystem/ChefInteractionLayer';

export default function MascotChef({ forceSmile = false }) {
  return (
    <div 
      className="mascot-chef-orchestrator relative w-[320px] h-[420px] mx-auto flex flex-col items-center justify-end z-40"
    >
      {/* 🧑‍🍳 Interactive Avatar SVG & Physics Layer */}
      <ChefInteractionLayer forceSmile={forceSmile} />

      {/* 💬 Apple Glassmorphic Speech Bubble */}
      <ChefSpeechBubble />
    </div>
  );
}
