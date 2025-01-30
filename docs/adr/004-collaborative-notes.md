# 004. Collaborative Note System Architecture

## Status
Proposed

## Context
Users need to collaborate on notes with:
- Real-time co-editing
- Contributor attribution
- Access control
- Version history

## Decision
Implement a hybrid CRDT/OT system using:

1. **Data Model Enhancements**
```typescript
// Updated Note type
interface Note {
  collaborators: Array<{
    user_id: string
    permission: 'view'|'edit'
    joined_at: string
  }>
  content_versions: Array<{
    content: string
    author: string
    timestamp: string
  }>
  sharing_token?: string
}
```

2. **Real-time Infrastructure**
- Supabase Realtime for presence and metadata
- Operational Transform for text collaboration
- Dedicated presence channel per note

3. **Security Model**
- Row-level security policies for:
  - Owner access
  - Collaborator access levels
  - Token-based sharing

4. **UI Components**
- Presence indicators in NoteEditor
- Contributor avatars in NoteCard
- ShareButton with permission controls