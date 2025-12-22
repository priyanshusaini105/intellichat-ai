import ChatWidget from "@/components/chat-widget";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-blue-200 blur-3xl" />
        <div className="absolute right-0 top-20 h-64 w-64 rounded-full bg-indigo-200 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
        <section className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#1a73e8]">
            <span className="h-2 w-2 rounded-full bg-[#1a73e8]" />
            Live preview
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
            Spur Support chatbot widget
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            A polished, multi-state chat widget that mirrors the Spur design: welcome handoff,
            contact details capture, and live conversation view.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Shows welcome screen
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              Conversation state
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Lead capture form
            </div>
          </div>
        </section>

        <ChatWidget />
      </div>
    </main>
  );
}
