import { NotepadText } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="bg-note-100 p-4 rounded-full">
        <NotepadText className="h-8 w-8 text-note-800" />
      </div>
      <h3 className="text-xl font-semibold text-note-800">No notes yet</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        Create your first note by clicking the "New Note" button above
      </p>
    </div>
  );
}