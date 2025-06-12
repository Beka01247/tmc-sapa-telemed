"use client";

import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";
import ChatBox from "./Chatbox";
import { FC } from "react";
import dynamic from "next/dynamic";

interface ChatWrapperProps {
  patientId: string;
  currentUser: {
    id: string;
    name: string;
    role: "DOCTOR" | "NURSE" | "PATIENT";
  };
}

const ChatWrapper: FC<ChatWrapperProps> = ({ patientId, currentUser }) => {
  const client = new Ably.Realtime({ authUrl: "api" });
  const channelName = `patient-${patientId}`;

  return (
    <AblyProvider client={client}>
      <ChannelProvider channelName={channelName}>
        <ChatBox patientId={patientId} currentUser={currentUser} />
      </ChannelProvider>
    </AblyProvider>
  );
};

export default dynamic(() => Promise.resolve(ChatWrapper), {
  ssr: false,
});
