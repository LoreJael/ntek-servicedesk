import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://bsbojujmanbxmfbfntyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYm9qdWptYW5ieG1mYmZudHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDU5NTEsImV4cCI6MjEwNDk4MTk1MX0.USyqU4LaIPmKpRx46OA2RvDl1aWdoWlA5CLbYBbJbjI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);