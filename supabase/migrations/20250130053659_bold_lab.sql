/*
  # Initial Schema Setup

  1. New Tables
    - users (handled by Supabase Auth)
    - notes
      - id (uuid, primary key)
      - title (text)
      - user_id (uuid, foreign key)
      - created_at (timestamptz)
      - updated_at (timestamptz)
      - collaborators (jsonb)
    - note_entries
      - id (uuid, primary key)
      - note_id (uuid, foreign key)
      - content (text)
      - audio_url (text)
      - entry_order (integer)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  collaborators jsonb DEFAULT '[]'::jsonb
);

-- Create note_entries table
CREATE TABLE IF NOT EXISTS note_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  content text,
  audio_url text,
  entry_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for notes
CREATE POLICY "Users can create their own notes"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes or notes they collaborate on"
  ON notes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(collaborators) AS c
      WHERE c->>'user_id' = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own notes or notes they can edit"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(collaborators) AS c
      WHERE c->>'user_id' = auth.uid()::text
      AND c->>'permission' = 'edit'
    )
  );

CREATE POLICY "Users can delete their own notes"
  ON notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for note_entries
CREATE POLICY "Users can create entries for their notes"
  ON note_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_id 
      AND (
        notes.user_id = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(notes.collaborators) AS c
          WHERE c->>'user_id' = auth.uid()::text
          AND c->>'permission' = 'edit'
        )
      )
    )
  );

CREATE POLICY "Users can view entries of their notes or collaborated notes"
  ON note_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_id 
      AND (
        notes.user_id = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(notes.collaborators) AS c
          WHERE c->>'user_id' = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "Users can update entries of their notes or editable notes"
  ON note_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_id 
      AND (
        notes.user_id = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(notes.collaborators) AS c
          WHERE c->>'user_id' = auth.uid()::text
          AND c->>'permission' = 'edit'
        )
      )
    )
  );

CREATE POLICY "Users can delete entries of their notes"
  ON note_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_entries_updated_at
  BEFORE UPDATE ON note_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();