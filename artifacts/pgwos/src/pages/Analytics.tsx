import { useGetAnalytics } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Analytics() {
  const { data, isLoading } = useGetAnalytics({ days: 30 });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#64748b'];

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold">Performance</h1>
        <p className="text-muted-foreground mt-1">Measure what matters. Improve every day.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border/50 rounded-3xl shadow-sm">
          <h3 className="font-bold text-lg mb-6">Productivity Trend (30 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.dailySummaries || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickFormatter={(val) => val.substring(5,10)} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="productivityScore" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/50 rounded-3xl shadow-sm">
          <h3 className="font-bold text-lg mb-6">Pipeline Distribution</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {data?.leadStatusCounts && data.leadStatusCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.leadStatusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                    stroke="none"
                  >
                    {data.leadStatusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', textTransform: 'capitalize' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No lead data available.</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {data?.leadStatusCounts?.map((entry, idx) => (
              <div key={entry.status} className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span>{entry.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/50 rounded-3xl shadow-sm lg:col-span-2">
          <h3 className="font-bold text-lg mb-6">Task & Habit Output</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailySummaries || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickFormatter={(val) => val.substring(5,10)} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  cursor={{ fill: 'hsl(var(--secondary))' }}
                />
                <Bar dataKey="habitsCompleted" name="Habits" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="tasksCompleted" name="Tasks" fill="#06b6d4" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
