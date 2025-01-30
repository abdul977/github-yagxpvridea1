import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Loader2, Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProcessingButton from "./ProcessingButton";
import { ProcessingVariant, Collaborator } from "@/types/note";
import { CollaboratorPresence } from "./CollaboratorPresence";
import { ShareButton } from "./ShareButton";

interface NoteEntry {
  id?: string;
  content: string;
  audio_url?: string;
  entry_order?: number;
  created_at?: string;
}

interface Note {
  id: string;
  title: string;
  entries: NoteEntry[];
  created_at: string;
  processingType: ProcessingVariant;
  collaborators: Collaborator[]; // Changed from string to Collaborator[]
}

interface NoteEditorProps {
  note?: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: { 
    id?: string; 
    title: string; 
    entries: NoteEntry[];
    collaborators?: Collaborator[];
  }) => void;
  currentUserId: string; // Add current user ID for collaboration
}

export function NoteEditor({ 
  note, 
  open, 
  onOpenChange, 
  onSave,
  currentUserId 
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [entries, setEntries] = useState<NoteEntry[]>([{ content: "", audio_url: undefined }]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setEntries(note.entries.length > 0
        ? note.entries
        : [{ content: "", audio_url: undefined }]);
    } else {
      setTitle("");
      setEntries([{ content: "", audio_url: undefined }]);
    }
  }, [note]);
  const [recordingEntryIndex, setRecordingEntryIndex] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = async (entryIndex: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        const { data, error } = await supabase.storage
          .from("audio_notes")
          .upload(`${crypto.randomUUID()}.webm`, file);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to upload audio recording.",
            variant: "destructive",
          });
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("audio_notes")
          .getPublicUrl(data.path);

        setEntries((prev) =>
          prev.map((entry, idx) =>
            idx === entryIndex ? { ...entry, audio_url: publicUrl } : entry
          )
        );
      };

      mediaRecorder.start();
      setRecordingEntryIndex(entryIndex);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingEntryIndex !== null) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecordingEntryIndex(null);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    const validEntries = entries.filter((entry) => entry.content.trim() || entry.audio_url);
    if (validEntries.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one entry with content or audio.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      id: note?.id,
      title,
      entries: validEntries,
      collaborators: note?.collaborators,
    });

    setTitle("");
    setEntries([{ content: "", audio_url: undefined }]);
    onOpenChange(false);
  };

  const addEntry = () => {
    setEntries([...entries, { content: "", audio_url: undefined }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, idx) => idx !== index));
    }
  };

  const updateEntryContent = (index: number, content: string) => {
    setEntries(
      entries.map((entry, idx) => (idx === index ? { ...entry, content } : entry))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        sm:max-w-[625px] 
        bg-gradient-to-br from-white/80 via-gray-50/80 to-gray-100/80 
        backdrop-blur-xl 
        border-2 border-white/20 
        shadow-2xl 
        rounded-2xl 
        overflow-hidden
      ">
        <DialogHeader>
          <DialogTitle className="
            text-3xl font-bold 
            bg-clip-text text-transparent 
            bg-gradient-to-r from-purple-600 to-pink-600
            animate-gradient-x
          ">
            {note ? "Edit Note" : "Create Note"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="
                bg-white/20 
                backdrop-blur-sm 
                border-white/30 
                focus:border-purple-500/50 
                focus:ring-2 
                focus:ring-purple-500/30 
                transition-all 
                duration-300
                text-gray-800
                placeholder-gray-500
              "
            />
          </div>
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div 
                key={index} 
                className="
                  space-y-2 
                  p-4 
                  bg-white/30 
                  backdrop-blur-md 
                  rounded-xl 
                  border 
                  border-white/20 
                  hover:border-purple-500/50 
                  transition-all 
                  duration-300 
                  relative 
                  group
                "
              >
                <Textarea
                  placeholder="Write your entry here..."
                  className="
                    min-h-[100px] 
                    bg-transparent 
                    border-white/30 
                    focus:border-purple-500/50 
                    focus:ring-2 
                    focus:ring-purple-500/30 
                    transition-all 
                    duration-300
                    text-gray-800
                    placeholder-gray-500
                  "
                  value={entry.content}
                  onChange={(e) => updateEntryContent(index, e.target.value)}
                />
                <div className="flex items-center space-x-4 mt-2">
                  {recordingEntryIndex === index ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={stopRecording}
                      className="
                        text-red-500 
                        hover:bg-red-500/10 
                        border-red-500/30 
                        group
                      "
                    >
                      <Square className="
                        h-5 w-5 
                        group-hover:scale-110 
                        transition-transform
                      " />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => startRecording(index)}
                      className="
                        hover:text-purple-500 
                        hover:bg-purple-500/10 
                        border-purple-500/30 
                        group
                      "
                      disabled={recordingEntryIndex !== null}
                    >
                      {recordingEntryIndex === null ? (
                        <Mic className="
                          h-5 w-5 
                          group-hover:scale-110 
                          transition-transform
                        " />
                      ) : (
                        <Loader2 className="
                          h-5 w-5 
                          animate-spin 
                          text-purple-500
                        " />
                      )}
                    </Button>
                  )}
                  {entry.audio_url && (
                    <audio 
                      controls 
                      src={entry.audio_url} 
                      className="
                        flex-1 
                        bg-purple-50/50 
                        rounded-full 
                        backdrop-blur-sm
                      " 
                    />
                  )}
                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEntry(index)}
                      className="
                        hover:text-red-500 
                        absolute 
                        top-2 
                        right-2 
                        hover:bg-red-500/10
                        group
                      "
                    >
                      <Trash className="
                        h-5 w-5 
                        text-gray-500 
                        group-hover:text-red-500 
                        group-hover:scale-110 
                        transition-all
                      " />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addEntry}
              className="
                w-full 
                bg-gradient-to-r from-purple-50 to-pink-50 
                hover:from-purple-100 hover:to-pink-100 
                border-purple-200/50 
                group
              "
            >
              <Plus className="
                h-5 w-5 
                mr-2 
                group-hover:rotate-180 
                transition-transform 
                text-purple-500
              " />
              <span className="text-gray-700 group-hover:text-purple-700 transition-colors">
                Add Entry
              </span>
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          {note && (
            <div className="flex items-center space-x-2">
              <CollaboratorPresence 
                noteId={note.id} 
                currentUserId={currentUserId} 
              />
              <ShareButton 
                noteId={note.id} 
                currentUserId={currentUserId} 
              />
            </div>
          )}
          <ProcessingButton 
            note={{
              id: note?.id,
              title,
              entries,
              created_at: note?.created_at,
              processingType: ProcessingVariant.SUMMARY, // Default processing variant
            collaborators: note?.collaborators || [],
              content_versions: [] // Add empty content versions
            }} 
          />
          <Button 
            onClick={handleSave} 
            className="
              bg-gradient-to-r from-purple-500 to-pink-500 
              text-white 
              hover:from-purple-600 hover:to-pink-600 
              transform hover:scale-105 
              transition-all
            "
          >
            Save Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}