import { useState, useEffect } from "react";
import { useListLeads, useCreateLead, useUpdateLead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Mail, Phone, Building2, Loader2, DollarSign } from "lucide-react";

const COLUMNS = [
  { id: "new", title: "New Lead", color: "border-l-blue-500" },
  { id: "contacted", title: "Contacted", color: "border-l-purple-500" },
  { id: "interested", title: "Interested", color: "border-l-amber-500" },
  { id: "follow_up", title: "Follow Up", color: "border-l-pink-500" },
  { id: "closed", title: "Closed Won", color: "border-l-emerald-500" },
  { id: "lost", title: "Lost", color: "border-l-red-500" },
];

export default function Leads() {
  const [search, setSearch] = useState("");
  const { data: leads, isLoading } = useListLeads(search ? { search } : undefined);
  const updateLead = useUpdateLead();
  const queryClient = useQueryClient();

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    // Optimistic UI could be implemented here, but we'll rely on fast mutation for now
    updateLead.mutate({
      id: parseInt(draggableId),
      data: { status: destination.droppableId }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/leads"] })
    });
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-20 h-[calc(100vh-6rem)] md:h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold">CRM Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage prospects and close deals.</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search leads..." 
              className="pl-9 bg-card border-border/50 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <AddLeadModal />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full min-w-max items-start">
            {COLUMNS.map(column => {
              const columnLeads = leads?.filter(l => l.status === column.id) || [];
              return (
                <div key={column.id} className="w-80 flex flex-col h-full bg-secondary/30 rounded-2xl p-4 border border-border/40">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">{column.title}</h3>
                    <span className="bg-background text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      {columnLeads.length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className={`flex-1 overflow-y-auto space-y-3 min-h-[150px] transition-colors rounded-xl ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                      >
                        {columnLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                              >
                                <LeadCard lead={lead} colorClass={column.color} isDragging={snapshot.isDragging} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

function LeadCard({ lead, colorClass, isDragging }: { lead: any, colorClass: string, isDragging: boolean }) {
  return (
    <Card className={`p-4 cursor-grab active:cursor-grabbing border-l-4 ${colorClass} ${isDragging ? 'shadow-2xl shadow-primary/20 rotate-2 z-50 ring-2 ring-primary/50' : 'hover:border-border hover:shadow-md'}`}>
      <h4 className="font-bold text-base truncate">{lead.name}</h4>
      {lead.businessName && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <Building2 className="h-3 w-3" /> <span className="truncate">{lead.businessName}</span>
        </div>
      )}
      
      <div className="mt-3 space-y-1.5">
        {lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" /> <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" /> <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {lead.dealValue && (
        <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
          <span className="text-xs font-semibold text-muted-foreground">Value</span>
          <span className="text-sm font-bold text-emerald-500 flex items-center">
            <DollarSign className="h-3.5 w-3.5" />{lead.dealValue.toLocaleString()}
          </span>
        </div>
      )}
    </Card>
  );
}

function AddLeadModal() {
  const [open, setOpen] = useState(false);
  const createLead = useCreateLead();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createLead.mutate({
      data: {
        name: fd.get("name") as string,
        businessName: fd.get("businessName") as string || null,
        email: fd.get("email") as string || null,
        phone: fd.get("phone") as string || null,
        status: "new",
        dealValue: fd.get("dealValue") ? parseInt(fd.get("dealValue") as string) : null,
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90 px-5">
          <Plus className="h-4 w-4 mr-2" /> New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Name *</label>
            <Input name="name" required className="bg-background" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company/Business</label>
            <Input name="businessName" className="bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" className="bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input name="phone" className="bg-background" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Estimated Deal Value ($)</label>
            <Input name="dealValue" type="number" min="0" className="bg-background" />
          </div>
          <Button type="submit" className="w-full mt-4 h-11" disabled={createLead.isPending}>
            {createLead.isPending ? "Saving..." : "Create Lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
