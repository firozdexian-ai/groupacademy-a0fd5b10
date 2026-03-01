import { EventsTab } from "@/components/learning/EventsTab";

export default function AppEvents() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Webinars & Events</h1>
        <p className="text-muted-foreground">Join live sessions and networking opportunities</p>
      </div>
      <EventsTab />
    </div>
  );
}
