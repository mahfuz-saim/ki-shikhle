export default function KidHome(){
  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">👋 Hi! Ready to log today?</h1>
      <p className="text-muted-foreground">Child dashboard: today&apos;s schedule, quick-log button, streak, own quiz history, simple progress bars. Big touch targets, friendly language.</p>
      <div className="grid grid-cols-2 gap-4">
        <a href="/kid/log" className="bg-primary text-primary-foreground p-6 rounded-xl text-center text-lg font-bold">📝 Quick Log</a>
        <a href="/kid/schedule" className="bg-card border p-6 rounded-xl text-center">📅 Today&apos;s Schedule</a>
        <a href="/kid/notes" className="bg-card border p-6 rounded-xl text-center">📸 Upload Notes</a>
        <a href="/kid/quiz" className="bg-amber-500 text-white p-6 rounded-xl text-center font-bold">🧠 Take Quiz</a>
      </div>
      <p className="text-sm text-muted-foreground">No red &quot;fail&quot; screens — low scores framed as &quot;let&apos;s practice&quot; 🎉</p>
    </div>
  );
}
