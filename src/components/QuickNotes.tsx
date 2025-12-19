import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Plus, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  color: string;
}

const COLORS = ['bg-yellow-500/20', 'bg-blue-500/20', 'bg-green-500/20', 'bg-pink-500/20', 'bg-purple-500/20'];

export const QuickNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('quick_notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('quick_notes', JSON.stringify(updatedNotes));
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      createdAt: new Date().toISOString(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
    
    saveNotes([note, ...notes]);
    setNewNote('');
    setIsAdding(false);
    toast({ title: 'Nota adicionada' });
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
    toast({ title: 'Nota removida' });
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-yellow-500" />
            <CardTitle className="text-sm font-medium">Notas Rápidas</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <div className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escreva sua nota..."
              className="min-h-[80px] text-sm"
            />
            <Button size="sm" onClick={addNote} className="w-full">
              <Save className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          </div>
        )}
        
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma nota. Clique + para adicionar.
            </p>
          ) : (
            notes.slice(0, 5).map((note) => (
              <div key={note.id} className={`p-2 rounded-lg ${note.color} group relative`}>
                <p className="text-xs pr-6">{note.content}</p>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteNote(note.id)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
