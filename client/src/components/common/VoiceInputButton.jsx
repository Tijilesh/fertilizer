import { useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import useVoiceInput from '../../utils/useVoiceInput'

const VoiceInputButton = ({ onTranscript, placeholder = "Click to speak", className = "" }) => {
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useVoiceInput()

  const handleClick = () => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }

  // Send transcript to parent when it changes
  useEffect(() => {
    if (transcript && onTranscript) {
      onTranscript(transcript)
    }
  }, [transcript, onTranscript])

  if (!isSupported) {
    return (
      <button
        disabled
        className={`p-2 text-gray-400 cursor-not-allowed ${className}`}
        title="Voice input not supported in this browser"
      >
        <MicOff className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 transition-colors duration-200 ${
        isListening
          ? 'text-red-500 hover:text-red-600 animate-pulse'
          : 'text-blue-500 hover:text-blue-600'
      } ${className}`}
      title={isListening ? "Listening... Click to stop" : placeholder}
    >
      {isListening ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  )
}

export default VoiceInputButton