
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceInterfaceProps {
  onTranscript: (transcript: string) => void;
  isListening?: boolean;
  className?: string;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  onTranscript, 
  isListening: externalIsListening,
  className 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error("Speech recognition is not supported in this browser.");
        return;
      }

      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        // Only send completed phrases (when isFinal is true)
        if (event.results[event.results.length - 1].isFinal) {
          onTranscript(transcript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please enable microphone permissions.");
        }
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        if (isListening) {
          recognition.stop();
        }
      }
    };
  }, []);

  // Controlled by external state if provided
  useEffect(() => {
    if (externalIsListening !== undefined && recognition) {
      if (externalIsListening && !isListening) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (error) {
          console.error('Error starting speech recognition', error);
        }
      } else if (!externalIsListening && isListening) {
        recognition.stop();
        setIsListening(false);
      }
    }
  }, [externalIsListening, recognition]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (!isListening) {
      try {
        recognition.start();
        setIsListening(true);
        toast.success("Listening...");
      } catch (error) {
        console.error('Error starting speech recognition', error);
        toast.error("Error starting speech recognition. Please try again.");
      }
    } else {
      recognition.stop();
      setIsListening(false);
      toast.info("Stopped listening");
    }
  }, [isListening, recognition]);

  return (
    <Button 
      onClick={toggleListening} 
      variant={isListening ? "destructive" : "outline"}
      className={className}
    >
      {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
      {isListening ? 'Stop' : 'Voice Input'}
    </Button>
  );
};

export default VoiceInterface;
