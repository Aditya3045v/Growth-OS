import { useState } from "react";
import { useListLeads, useCreateLead, useUpdateLead, useDeleteLead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const COLUMNS = [
  { id: "new",        title: "New",       color: "#94aaff" },
  { id: "contacted",  title: "Contacted", color: "#5cfd80" },
  { id: "interested", title: "Interested",color: "#ffbd5c" },
  { id: "follow_up",  title: "Follow Up", color: "#ec9e00" },
  { id: "closed",     title: "Closed Won",color: "#5cfd80" },
  { id: "lost",       title: "Lost",      color: "#ff6e84" },
];

export default function Leads() {
  const [search, setSearch] = useState("");
  const { data: leads, isLoading } = useListLeads(search ? { search } : undefined);
  const updateLead = useUpdateLead();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/leads"] });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    if (result.source.droppableId === result.destination.droppableId) return;
    updateLead.mutate({
      id: parseInt(result.draggableId),
      data: { status: result.destination.droppableId }
    }, { onSuccess: invalidate });
  };

  return (
    <div className="py-6 space-y-5 h-[calc(100vh-9rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-['Manrope'] font-extrabold text-3xl tracking-tight">Pipeline</h1>
          <p className="text-[#adaaaa] text-sm mt-0.5">Manage prospects and close deals.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#adaaaa] text-[18px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0e0e0e] border-none rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] ds-ghost-border text-sm"
              placeholder="Search leads, companies..."
            />
          </div>
          <button
            onClick={() => { setEditLead(null); setShowForm(true); }}
            className="p-3.5 ds-liquid-gradient rounded-2xl text-[#000] ds-inner-glow active:scale-95 transition-transform shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <LeadFormModal
          initial={editLead}
          onClose={() => { setShowForm(false); setEditLead(null); }}
          onSaved={invalidate}
        />
      )}

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-5 h-full min-w-max items-start">
            {COLUMNS.map((col) => {
              const colLeads = leads?.filter((l) => l.status === col.id) || [];
              return (
                <div key={col.id} className="w-72 flex flex-col bg-[#131313] rounded-2xl p-4 ds-ghost-border min-h-[300px]">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-['Manrope'] font-extrabold text-[11px] uppercase tracking-[0.15em] text-[#adaaaa] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                      {col.title}
                    </h3>
                    <span className="text-[11px] font-['Inter'] font-bold bg-[#1a1a1a] text-[#adaaaa] px-2 py-0.5 rounded-full">
                      {colLeads.length}
                    </span>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 space-y-3 min-h-[100px] rounded-xl transition-colors ${snapshot.isDraggingOver ? "bg-[rgba(148,170,255,0.05)]" : ""}`}
                      >
                        {colLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                              >
                                <LeadCard
                                  lead={lead}
                                  color={col.color}
                                  isDragging={snapshot.isDragging}
                                  onEdit={() => { setEditLead(lead); setShowForm(true); }}
                                />
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

function LeadCard({ lead, color, isDragging, onEdit }: {
  lead: any; color: string; isDragging: boolean; onEdit: () => void;
}) {
  const deleteLead = useDeleteLead();
  const queryClient = useQueryClient();

  const remove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this lead?")) {
      deleteLead.mutate({ id: lead.id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/leads"] })
      });
    }
  };

  return (
    <div
      className={`bg-[#1a1a1a] p-4 rounded-2xl ds-ghost-border transition-all group ${
        isDragging ? "shadow-2xl rotate-2 ring-2 ring-[#94aaff]/30" : "hover:border-[rgba(72,72,71,0.3)]"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0">
          <h4 className="font-['Manrope'] font-bold text-base text-white leading-tight truncate">{lead.name}</h4>
          {lead.businessName && (
            <p className="text-[11px] text-[#adaaaa] font-['Inter'] mt-0.5 truncate">{lead.businessName}</p>
          )}
        </div>
        <span
          className="text-[10px] font-['Inter'] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ml-2"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {lead.status.replace("_", " ")}
        </span>
      </div>

      <div className="space-y-1 mt-3">
        {lead.email && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#adaaaa]">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#adaaaa]">
            <span className="material-symbols-outlined text-[14px]">phone</span>
            <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {lead.dealValue && (
        <div className="mt-3 pt-3 border-t border-[rgba(72,72,71,0.1)] flex items-center justify-between">
          <span className="text-[10px] text-[#adaaaa] uppercase tracking-wider">Value</span>
          <span className="text-sm font-['Manrope'] font-bold text-[#5cfd80]">
            ${lead.dealValue.toLocaleString()}
          </span>
        </div>
      )}

      <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(72,72,71,0.1)] opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94aaff] bg-[rgba(148,170,255,0.1)] rounded-lg hover:bg-[rgba(148,170,255,0.15)] transition-colors">
          Edit
        </button>
        <button onClick={remove} className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ff6e84] bg-[rgba(255,110,132,0.1)] rounded-lg hover:bg-[rgba(255,110,132,0.15)] transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

function LeadFormModal({ initial, onClose, onSaved }: {
  initial: any; onClose: () => void; onSaved: () => void;
}) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      businessName: (fd.get("businessName") as string) || null,
      email: (fd.get("email") as string) || null,
      phone: (fd.get("phone") as string) || null,
      status: (fd.get("status") as string) || "new",
      dealValue: fd.get("dealValue") ? parseInt(fd.get("dealValue") as string) : null,
      notes: (fd.get("notes") as string) || null,
    };
    const opts = { onSuccess: () => { onSaved(); onClose(); } };
    if (initial) {
      updateLead.mutate({ id: initial.id, data }, opts);
    } else {
      createLead.mutate({ data }, opts);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#000]/75 backdrop-blur-sm p-4">
      <div className="bg-[#131313] w-full max-w-md rounded-3xl p-6 space-y-5 ds-ghost-border max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-['Manrope'] font-bold text-xl">{initial ? "Edit Lead" : "New Lead"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-[#adaaaa] hover:bg-[#2c2c2c]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" required defaultValue={initial?.name || ""} autoFocus
            className="w-full bg-[#262626] border-none rounded-xl py-4 px-5 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] font-medium"
            placeholder="Contact Name *"
          />
          <input name="businessName" defaultValue={initial?.businessName || ""}
            className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-5 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
            placeholder="Company / Business"
          />
          <div className="grid grid-cols-2 gap-3">
            <input name="email" type="email" defaultValue={initial?.email || ""}
              className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
              placeholder="Email"
            />
            <input name="phone" defaultValue={initial?.phone || ""}
              className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
              placeholder="Phone"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="dealValue" type="number" min="0" defaultValue={initial?.dealValue || ""}
              className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
              placeholder="Deal Value ($)"
            />
            <select name="status" defaultValue={initial?.status || "new"}
              className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-4 text-white focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="follow_up">Follow Up</option>
              <option value="closed">Closed Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <textarea name="notes" defaultValue={initial?.notes || ""}
            className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-5 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] resize-none"
            placeholder="Notes about this lead..."
            rows={3}
          />
          <button
            type="submit"
            disabled={createLead.isPending || updateLead.isPending}
            className="w-full ds-liquid-gradient py-4 rounded-2xl font-['Manrope'] font-extrabold text-[#000] ds-inner-glow active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {createLead.isPending || updateLead.isPending ? "Saving..." : initial ? "Update Lead" : "Create Lead"}
          </button>
        </form>
      </div>
    </div>
  );
}
