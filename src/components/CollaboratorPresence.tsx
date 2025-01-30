import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface Collaborator {
  user_id: string;
  email?: string;
  display_name?: string;
  permission: 'view' | 'edit';
  joined_at: string;
}

interface CollaboratorPresenceProps {
  noteId: string;
  currentUserId: string;
}

export function CollaboratorPresence({ noteId, currentUserId }: CollaboratorPresenceProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeCollaborators, setActiveCollaborators] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('collaborators')
          .eq('id', noteId)
          .single();

        if (error) {
          throw error;
        }

        // Parse collaborators from JSON column
        const noteCollaborators = data?.collaborators 
          ? JSON.parse(data.collaborators) 
          : [];

        setCollaborators(noteCollaborators);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to fetch collaborators',
          variant: 'destructive'
        });
      }
    };

    const channel = supabase.channel(`note:${noteId}`);
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const activeUsers = Object.keys(newState);
        setActiveCollaborators(activeUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            user_id: currentUserId, 
            note_id: noteId 
          });
        }
      });

    fetchCollaborators();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, currentUserId, toast]);

  const getCollaboratorStatus = (userId: string) => {
    const collaborator = collaborators.find(c => c.user_id === userId);
    const isActive = activeCollaborators.includes(userId);

    return {
      status: isActive ? 'online' : 'offline',
      permission: collaborator?.permission || 'view',
      displayName: collaborator?.display_name || collaborator?.email || userId
    };
  };

  if (collaborators.length === 0) {
    return null;
  }

  return (
    <div className="flex space-x-[-10px]">
      {collaborators.map((collaborator) => {
        const { status, permission, displayName } = getCollaboratorStatus(collaborator.user_id);
        
        return (
          <TooltipProvider key={collaborator.user_id}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar 
                  className={`
                    border-2 
                    ${status === 'online' ? 'border-green-500' : 'border-gray-300'}
                    ${permission === 'edit' ? 'ring-2 ring-purple-500' : ''}
                  `}
                >
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${collaborator.user_id}`} 
                    alt={`Collaborator ${displayName}`} 
                  />
                  <AvatarFallback>{displayName.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  User: {displayName}
                  <br />
                  Status: {status}
                  <br />
                  Permission: {permission}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}