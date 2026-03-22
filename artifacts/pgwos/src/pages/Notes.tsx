import { useState } from "react";
import { useListNotes, useCreateNote } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Search, Hash } from "lucide-react";

export default function Notes() {
  const [search, setSearch] = useState("");
  const { data: notes, isLoading } = useListNotes(search ? { search } : undefined);

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Learning Log</h1>
          <p className="text-muted-foreground mt-1">Capture ideas, reflections, and knowledge.</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search notes..." 
              className="pl-9 bg-card border-border/50 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <AddNoteModal />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes?.map(note => (
          <Card key={note.id} className="p-6 bg-card border-border/50 hover:border-primary/30 hover:shadow-lg transition-all rounded-2xl flex flex-col h-64 group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg line-clamp-1">{note.title}</h3>
              <span className="text-xs text-muted-foreground shrink-0">{format(new Date(note.createdAt), "MMM d")}</span>
            </div>
            <p className="text-sm text-muted-foreground flex-1 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
              {note.content}
            </p>
            {note.tags && note.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50 flex gap-2 flex-wrap">
                {note.tags.map((tag: string) => (
                  <span key={tag} className="flex items-center text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                    <Hash className="h-3 w-3 mr-0.5" />{tag}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
        {notes?.length === 0 && (
          <div className="col-span-full text-center py-20 border-2 border-dashed border-border rounded-2xl bg-secondary/20">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">No notes found</p>
            <p className="text-muted-foreground">Start capturing your thoughts today.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BookOpen(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}

function AddNoteModal() {
  const [open, setOpen] = useState(false);
  const createNote = useCreateNote();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tagsRaw = fd.get("tags") as string;
    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
    
    createNote.mutate({
      data: {
        title: fd.get("title") as string,
        content: fd.get("content") as string,
        tags,
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90 px-5">
          <Plus className="h-4 w-4 mr-2" /> New Note
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Write a Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input name="title" placeholder="Note Title" required className="bg-background text-lg font-bold h-12" />
          <Textarea 
            name="content" 
            placeholder="Write your thoughts here..." 
            required 
            className="bg-background min-h-[200px] resize-y" 
          />
          <Input name="tags" placeholder="Tags (comma separated, e.g. marketing, ideas)" className="bg-background" />
          
          <Button type="submit" className="w-full mt-4 h-11" disabled={createNote.isPending}>
            {createNote.isPending ? "Saving..." : "Save Note"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
