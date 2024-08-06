'use client';

import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';

// Function to format timestamp
const formatDate = (date) => {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return date.toLocaleTimeString([], options);
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize messages on the client side
    setMessages([
      {
        role: 'assistant',
        content:
          "Hi! I'm the Headstarter support assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return; // Don't send empty messages
    setIsLoading(true);

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((messages) => [
      ...messages,
      userMessage,
      { role: 'assistant', content: '', timestamp: new Date() }, // Placeholder for assistant response
    ]);
    setMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, userMessage]),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
              timestamp: new Date(),
            },
          ];
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => [
        ...messages,
        {
          role: 'assistant',
          content:
            "I'm sorry, but I encountered an error. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start" // Align items to start from the top
      bgcolor="#f1f3f4"
    >
      {/* Title at the top left */}
      <Box
        width={{ xs: '90%', sm: '80%', md: '60%', lg: '40%' }}
        textAlign="left"
        mt={2} // Add some margin from the top
        ml={2} // Add some margin from the left
      >
        <Typography variant="h6" color="textPrimary">
          Chat with Headstarter AI
        </Typography>
      </Box>

      {/* Chat interface */}
      <Stack
        direction={'column'}
        width={{ xs: '90%', sm: '80%', md: '60%', lg: '40%' }}
        height="80vh"
        bgcolor="white"
        borderRadius={2}
        boxShadow={3}
        p={2}
        mt={2} // Add margin to separate title from chat
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
          sx={{ padding: '0 16px', boxSizing: 'border-box' }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems:
                  message.role === 'assistant' ? 'flex-start' : 'flex-end',
              }}
            >
              {/* Label and timestamp for each message */}
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{
                  marginBottom: '4px',
                  textAlign: message.role === 'assistant' ? 'left' : 'right',
                  width: '100%', // Ensure label takes the full width
                }}
              >
                {message.role === 'assistant'
                  ? `Headstarter Assistance`
                  : 'You'}{' '}
                | {formatDate(message.timestamp)}
              </Typography>

              {/* Message Bubble */}
              <Box
                display="flex"
                justifyContent={
                  message.role === 'assistant' ? 'flex-start' : 'flex-end'
                }
                width="100%"
              >
                <Box
                  bgcolor={
                    message.role === 'assistant'
                      ? 'primary.main'
                      : 'secondary.main'
                  }
                  color="white"
                  borderRadius={8}
                  p={2}
                  sx={{
                    maxWidth: '75%',
                    wordWrap: 'break-word',
                  }}
                >
                  <Typography variant="body2">{message.content}</Typography>
                </Box>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2} alignItems="center">
          <TextField
            label="Type a message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            multiline
            rows={1}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '50px',
              },
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
            sx={{
              minWidth: 50,
              minHeight: 50,
              borderRadius: '50%',
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Send'
            )}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
