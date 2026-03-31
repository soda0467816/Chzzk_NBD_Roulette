import { ChzzkLiveDonationClient } from "../lib/chzzk-live-donation-client.mjs";

const [, , channelIdArg] = process.argv;
const channelId = channelIdArg || process.env.CHZZK_CHANNEL_ID || "";

if (!channelId) {
  console.error("Usage: node scripts/test-live-donations.mjs <channelId>");
  process.exit(1);
}

const client = new ChzzkLiveDonationClient({
  channelId,
  nidAuth: process.env.NID_AUT || "",
  nidSession: process.env.NID_SES || "",
});

client.on("liveStatus", (status) => {
  console.log("[liveStatus]", {
    status: status?.status,
    chatChannelId: status?.chatChannelId,
    liveTitle: status?.liveTitle,
  });
});

client.on("connect", (info) => {
  console.log("[connect]", info);
});

client.on("donation", (donation) => {
  console.log("[donation]", {
    nickname: donation.nickname,
    payAmount: donation.payAmount,
    message: donation.message,
    donationType: donation.donationType,
    isAnonymous: donation.isAnonymous,
  });
});

client.on("chat", (chat) => {
  console.log("[chat]", {
    nickname: chat.nickname,
    message: chat.message,
    hidden: chat.hidden,
  });
});

client.on("disconnect", () => {
  console.log("[disconnect]");
});

client.on("error", (error) => {
  console.error("[error]", error?.message || error);
});

await client.connect();
