import { currentProfile } from "@/lib/current-profile";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ChannelType, MemberRole } from "@prisma/client";
import ServerHeader from "@/components/server/server-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import ServerSearch from "@/components/server/server-search";
import { Hash, Mic, ShieldAlert, ShieldCheck, Video } from "lucide-react";

interface ServerSidebarProps {
  serverId: string;
}
const ServerSidebar = async ({ serverId }: ServerSidebarProps) => {
  const profile = await currentProfile();

  const iconMap = {
    [ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
    [ChannelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
    [ChannelType.VIDEO]: <Video className="mr-2 h-4 w-4" />,
  };

  if (!profile) {
    redirect("/");
  }
  const roleIconMap = {
    [MemberRole.GUEST]: null,
    [MemberRole.MODERATOR]: (
      <ShieldCheck className="h-4 w-4 mr-2 text-indigo-500" />
    ),
    [MemberRole.ADMIN]: (
      <ShieldAlert className="h-4 w-4 mr-2 text-indigo-500" />
    ),
  };

  const server = await db.server.findUnique({
    where: {
      id: serverId,
    },
    include: {
      channels: { orderBy: { createdAt: "asc" } },

      members: { include: { profile: true }, orderBy: { role: "asc" } },
    },
  });

  if (!server) {
    return redirect("/");
  }

  const role = server.members?.find((member) => member.profileId === profile.id)
    ?.role; // what is the role of the user viewing the server

  const textChannels = server?.channels.filter(
    (channel) => channel.type === ChannelType.TEXT,
  );
  const audioChannels = server?.channels.filter(
    (channel) => channel.type === ChannelType.AUDIO,
  );
  const videoChannels = server?.channels.filter(
    (channel) => channel.type === ChannelType.VIDEO,
  );
  const members = server?.members.filter(
    (member) => member.profileId != profile.id,
  ); // everyone else in the server (not including the user that is viewing the server)

  const textChannelData = textChannels?.map((channel) => ({
    icon: iconMap[channel.type], // Replace with your actual icon component
    name: channel.name,
    id: channel.id,
  }));

  const audioChannelData = audioChannels?.map((channel) => ({
    icon: iconMap[channel.type], // Replace with your actual icon component
    name: channel.name,
    id: channel.id,
  }));

  const videoChannelData = videoChannels?.map((channel) => ({
    icon: iconMap[channel.type], // Replace with your actual icon component
    name: channel.name,
    id: channel.id,
  }));

  const memberData = members?.map((member) => ({
    icon: roleIconMap[member.role], // Replace with your actual icon component
    name: member.profile.name,
    id: member.id,
  }));

  const searchData = [
    {
      label: "Text Channels",
      type: "channel" as "channel",
      data: textChannelData,
    },
    {
      label: "Audio Channels",
      type: "channel" as "channel",
      data: audioChannelData,
    },
    {
      label: "Video Channels",
      type: "channel" as "channel",
      data: videoChannelData,
    },
    { label: "Members", type: "member" as "member", data: memberData },
  ];

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      <ServerHeader server={server} role={role} />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch data={searchData} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ServerSidebar;
