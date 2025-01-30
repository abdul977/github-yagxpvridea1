import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface Collaborator {
  user_id: string;
  email?: string;
  display_name?: string;
  permission: 'view' | 'edit';
  joined_at: string;
}

export async function inviteCollaborator(
  noteId: string, 
  collaborator: Omit<Collaborator, 'joined_at'>
): Promise<boolean> {
  try {
    // First check if the note exists and get current collaborators
    const { data: noteData, error: fetchError } = await supabase
      .from('notes')
      .select('collaborators')
      .eq('id', noteId)
      .single();

    if (fetchError) {
      console.error('Error fetching note:', fetchError);
      return false;
    }

    // Parse existing collaborators or initialize empty array
    const existingCollaborators: Collaborator[] = noteData?.collaborators 
      ? JSON.parse(noteData.collaborators) 
      : [];

    // Check if collaborator already exists
    const collaboratorExists = existingCollaborators.some(
      c => c.user_id === collaborator.user_id || c.email === collaborator.email
    );

    if (collaboratorExists) {
      console.error('Collaborator already exists');
      return false;
    }

    // Add new collaborator with current timestamp
    const newCollaborator = {
      ...collaborator,
      joined_at: new Date().toISOString()
    };

    const updatedCollaborators = [...existingCollaborators, newCollaborator];

    // Update note with new collaborators list
    const { error: updateError } = await supabase
      .from('notes')
      .update({ 
        collaborators: JSON.stringify(updatedCollaborators) 
      })
      .eq('id', noteId);

    if (updateError) {
      console.error('Error updating collaborators:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    return false;
  }
}

export async function generateShareLink(
  noteId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Generate a unique token
    const token = crypto.randomUUID();

    // Update the note with the sharing token
    const { error: updateError } = await supabase
      .from('notes')
      .update({ sharing_token: token })
      .eq('id', noteId);

    if (updateError) throw updateError;

    // Generate the share URL
    const shareUrl = `${window.location.origin}/share/${noteId}?token=${token}`;
    
    return { url: shareUrl, error: null };
  } catch (error) {
    console.error('Error generating share link:', error);
    return { url: null, error: error as Error };
  }
}

export async function validateShareToken(
  noteId: string,
  token: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('sharing_token')
      .eq('id', noteId)
      .single();

    if (error) throw error;

    return data.sharing_token === token;
  } catch (error) {
    console.error('Error validating share token:', error);
    return false;
  }
}

export async function removeCollaborator(
  noteId: string, 
  userId: string
): Promise<boolean> {
  try {
    // Fetch current note to get existing collaborators
    const { data: noteData, error: fetchError } = await supabase
      .from('notes')
      .select('collaborators')
      .eq('id', noteId)
      .single();

    if (fetchError) {
      console.error('Error fetching note:', fetchError);
      return false;
    }

    // Parse existing collaborators
    const existingCollaborators: Collaborator[] = noteData.collaborators 
      ? JSON.parse(noteData.collaborators) 
      : [];

    // Remove specified collaborator
    const updatedCollaborators = existingCollaborators.filter(
      c => c.user_id !== userId
    );

    // Update note with new collaborators list
    const { error: updateError } = await supabase
      .from('notes')
      .update({ 
        collaborators: JSON.stringify(updatedCollaborators) 
      })
      .eq('id', noteId);

    if (updateError) {
      console.error('Error updating collaborators:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return false;
  }
}

export async function updateCollaboratorPermission(
  noteId: string, 
  userId: string, 
  permission: 'view' | 'edit'
): Promise<boolean> {
  try {
    // Fetch current note to get existing collaborators
    const { data: noteData, error: fetchError } = await supabase
      .from('notes')
      .select('collaborators')
      .eq('id', noteId)
      .single();

    if (fetchError) {
      console.error('Error fetching note:', fetchError);
      return false;
    }

    // Parse existing collaborators
    const existingCollaborators: Collaborator[] = noteData.collaborators 
      ? JSON.parse(noteData.collaborators) 
      : [];

    // Update collaborator's permission
    const updatedCollaborators = existingCollaborators.map(c => 
      c.user_id === userId 
        ? { ...c, permission } 
        : c
    );

    // Update note with new collaborators list
    const { error: updateError } = await supabase
      .from('notes')
      .update({ 
        collaborators: JSON.stringify(updatedCollaborators) 
      })
      .eq('id', noteId);

    if (updateError) {
      console.error('Error updating collaborator permission:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating collaborator permission:', error);
    return false;
  }
}