"use client";

import React, { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useChannel } from "ably/react";
import type { Types } from "ably";

type Message = {
  connectionId: string;
  data: string;
  sender: {
    id: string;
    name: string;
    role: "DOCTOR" | "NURSE" | "PATIENT";
  };
  timestamp: number;
};

interface ChatBoxProps {
  patientId: string;
  currentUser: {
    id: string;
    name: string;
    role: "DOCTOR" | "NURSE" | "PATIENT";
  };
}

const ChatBox: FC<ChatBoxProps> = ({ patientId, currentUser }) => {
  const [messageText, setMessageText] = useState<string>("");
  const [receivedMessages, setMessages] = useState<Message[]>([]);
  const messageTextIsEmpty = messageText.trim().length === 0;
  const inputBox = useRef<HTMLTextAreaElement | null>(null);
  const messageEnd = useRef<HTMLDivElement | null>(null);

  const { channel } = useChannel(
    `patient-${patientId}`,
    (message: Types.Message) => {
      const messageData = message.data as {
        text: string;
        sender: {
          id: string;
          name: string;
          role: "DOCTOR" | "NURSE" | "PATIENT";
        };
        timestamp: number;
      };

      setMessages((prevMessages) => {
        const history = prevMessages.slice(-199);
        return [
          ...history,
          {
            connectionId: message.connectionId ?? "",
            data: messageData.text,
            sender: messageData.sender,
            timestamp: messageData.timestamp,
          },
        ];
      });
    }
  );

  useEffect(() => {
    const loadMessageHistory = async () => {
      try {
        const historicalMessages = await channel.history({ limit: 100 });
        const messages = historicalMessages.items.map((msg) => ({
          connectionId: msg.connectionId ?? "",
          data: msg.data.text,
          sender: msg.data.sender,
          timestamp: msg.data.timestamp,
        }));
        setMessages(messages.reverse());
      } catch (error) {
        console.error("Error loading message history:", error);
      }
    };

    loadMessageHistory();
  }, [channel]);

  const sendChatMessage = (messageText: string) => {
    channel.publish({
      name: "chat-message",
      data: {
        text: messageText,
        sender: currentUser,
        timestamp: Date.now(),
      },
    });
    setMessageText("");
    inputBox.current?.focus();
  };

  const handleFormSubmission = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendChatMessage(messageText);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.charCode !== 13 || messageTextIsEmpty) {
      return;
    }
    sendChatMessage(messageText);
    event.preventDefault();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const messages = receivedMessages.map((message, index) => {
    const isCurrentUser = message.sender.id === currentUser.id;
    const roleColors = {
      DOCTOR: "bg-blue-500",
      NURSE: "bg-green-500",
      PATIENT: "bg-gray-500",
    };

    return (
      <div
        key={index}
        className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} mb-4`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-600">
            {message.sender.name} ({message.sender.role.toLowerCase()})
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div
          className={`px-4 py-2 rounded-lg max-w-[80%] ${
            isCurrentUser
              ? `ml-auto ${roleColors[message.sender.role]} text-white rounded-br-none`
              : "mr-auto bg-gray-200 text-gray-800 rounded-bl-none"
          }`}
        >
          {message.data}
        </div>
      </div>
    );
  });

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [receivedMessages]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {messages}
          <div ref={messageEnd}></div>
        </div>
      </div>
      <form
        onSubmit={handleFormSubmission}
        className="p-4 border-t border-gray-200"
      >
        <div className="flex gap-2">
          <textarea
            ref={inputBox}
            value={messageText}
            placeholder="Type a message..."
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-[45px] min-h-[45px]"
            rows={1}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg font-medium ${
              messageTextIsEmpty
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            disabled={messageTextIsEmpty}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
