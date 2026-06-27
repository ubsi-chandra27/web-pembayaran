export function roleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function roleBadgeClass(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: "bg-indigo-100 text-indigo-700",
    TATA_USAHA: "bg-sky-100 text-sky-700",
    BENDAHARA: "bg-amber-100 text-amber-700",
    ORANG_TUA: "bg-teal-100 text-teal-700",
    KEPALA_SEKOLAH: "bg-purple-100 text-purple-700",
    GURU: "bg-rose-100 text-rose-700",
  };

  return map[role] ?? "bg-slate-100 text-slate-700";
}

export function avatarClass(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: "bg-indigo-600",
    TATA_USAHA: "bg-sky-600",
    BENDAHARA: "bg-amber-500",
    ORANG_TUA: "bg-teal-600",
    KEPALA_SEKOLAH: "bg-purple-600",
    GURU: "bg-rose-500",
  };

  return map[role] ?? "bg-slate-500";
}
