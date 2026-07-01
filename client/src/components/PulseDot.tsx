interface Props {
  tone?: "live" | "muted" | "alert";
  title?: string;
}

const map = {
  live: "bg-[#0FA3A3] animate-pulse-ring",
  muted: "bg-[#AEB5C2]",
  alert: "bg-[#F0563B]",
};

// The poll heartbeat — a breathing dot marks a sheet as actively watched.
export default function PulseDot({ tone = "live", title }: Props) {
  return (
    <span
      title={title}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${map[tone]}`}
    />
  );
}
