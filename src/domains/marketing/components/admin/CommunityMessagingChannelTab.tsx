import { MessagingChannelsTab } from "@/domains/messaging/components/admin/MessagingChannelsTab";

export function CommunityMessagingChannelTab() {
  return (
    <div className="p-2">
      <MessagingChannelsTab
        agentKey="community-engine"
        defaultLabel="Community Engine â€” BD"
        defaultRegion="Bangladesh"
        title="Community WhatsApp Line"
        description="Default home for professionÃ—country community groups and course cohorts. Connect a fresh number via Unipile hosted-auth."
      />
    </div>
  );
}

export default CommunityMessagingChannelTab;

