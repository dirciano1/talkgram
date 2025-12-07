import { db, doc, getDoc } from "@/lib/firebase";

export async function getCreditos(uid: string): Promise<number> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return 0;

  const data = snap.data() as { creditos?: number };
  return data.creditos ?? 0;
}
