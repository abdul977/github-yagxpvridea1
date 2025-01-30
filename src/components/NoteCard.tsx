import { Pencil, Trash2, PlayCircle, PauseCircle, Copy, Share } from "lucide-react";
import { TranscriptionButton } from "./TranscriptionButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Note, NoteEntry } from "@/types/note";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function NoteCard({ note, onEdit, onDelete, className }: NoteCardProps) {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const getCombinedContent = () => {
    return note.entries.map(entry => {
      let content = entry.content;
      if (entry.audioTranscription) {
        content += `\n\n[Audio Transcription]: ${entry.audioTranscription}`;
      }
      return content;
    }).join('\n\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCombinedContent());
      toast.success('Note content copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy note content');
    }
  };

  const handleShare = async () => {
    const content = getCombinedContent();
    try {
      if (navigator.share) {
        await navigator.share({
          title: note.title,
          text: content,
        });
      } else {
        await navigator.clipboard.writeText(content);
        toast.info('Note content copied to clipboard (sharing not supported)');
      }
    } catch (err) {
      if (!(err instanceof Error) || !err.message.includes('AbortError')) {
        toast.error('Failed to share note');
      }
    }
  };

  const toggleAudio = (entryId: string, audioUrl?: string) => {
    if (!audioUrl || !audioRefs.current[entryId]) return;

    if (playingAudioId === entryId) {
      audioRefs.current[entryId]?.pause();
      setPlayingAudioId(null);
    } else {
      // Pause any currently playing audio
      if (playingAudioId && audioRefs.current[playingAudioId]) {
        audioRefs.current[playingAudioId]?.pause();
      }
      audioRefs.current[entryId]?.play();
      setPlayingAudioId(entryId);
    }
  };

  return (
    <Card className={cn(
      "p-6 space-y-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl",
      "bg-gradient-to-br from-white via-gray-50 to-gray-100",
      "border-2 border-transparent hover:border-purple-200/50",
      className
    )}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="
            font-bold text-2xl 
            bg-clip-text text-transparent 
            bg-gradient-to-r from-purple-600 to-pink-600
            animate-gradient-x
          ">
            {note.title}
          </h3>
          <p className="text-sm text-gray-500 italic">
            {new Date(note.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="space-x-2 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(note)}
            className="
              hover:bg-blue-50 
              group 
              transition-all 
              hover:scale-110
            "
          >
            <Pencil className="
              h-5 w-5 
              text-gray-500 
              group-hover:text-blue-500 
              transition-colors
            " />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(note.id)}
            className="
              hover:bg-red-50 
              group 
              transition-all 
              hover:scale-110
            "
          >
            <Trash2 className="
              h-5 w-5 
              text-gray-500 
              group-hover:text-red-500 
              transition-colors
            " />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="
              hover:bg-green-50
              group
              transition-all
              hover:scale-110
            "
          >
            <Copy className="
              h-5 w-5
              text-gray-500
              group-hover:text-green-500
              transition-colors
            " />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="
              hover:bg-purple-50
              group
              transition-all
              hover:scale-110
            "
          >
            <Share className="
              h-5 w-5
              text-gray-500
              group-hover:text-purple-500
              transition-colors
            " />
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {note.entries.map((entry) => (
          <div 
            key={entry.id} 
            className="
              space-y-2 
              p-4 
              bg-white/50 
              backdrop-blur-sm 
              rounded-lg 
              border 
              border-gray-100 
              hover:border-purple-200/50 
              transition-all
            "
          >
            <p className="
              text-gray-800 
              bg-clip-text 
              text-transparent 
              bg-gradient-to-r from-gray-800 to-gray-600
            ">
              {entry.content}
            </p>
            {entry.audio_url && (
              <div className="space-y-3">
                <audio
                  ref={(el) => (audioRefs.current[entry.id] = el)}
                  src={entry.audio_url}
                  onEnded={() => setPlayingAudioId(null)}
                />
                <TranscriptionButton
                  audioUrl={entry.audio_url}
                  onTranscriptionComplete={(transcription) => {
                    const updatedEntries = note.entries.map(e =>
                      e.id === entry.id ? {...e, audioTranscription: transcription} : e
                    );
                    onEdit({...note, entries: updatedEntries});
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAudio(entry.id, entry.audio_url)}
                  className="
                    flex items-center space-x-2 
                    bg-gradient-to-r from-purple-50 to-pink-50 
                    hover:from-purple-100 hover:to-pink-100 
                    border-purple-200/50 
                    group
                  "
                >
                  {playingAudioId === entry.id ? (
                    <PauseCircle className="
                      h-5 w-5 
                      text-red-500 
                      group-hover:scale-110 
                      transition-transform
                    " />
                  ) : (
                    <PlayCircle className="
                      h-5 w-5 
                      text-purple-500 
                      group-hover:scale-110 
                      transition-transform
                    " />
                  )}
                  <span className="
                    text-gray-700 
                    group-hover:text-purple-700 
                    transition-colors
                  ">
                    {playingAudioId === entry.id ? "Pause" : "Play"} Recording
                  </span>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}