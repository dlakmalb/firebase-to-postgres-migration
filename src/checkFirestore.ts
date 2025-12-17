import { getFirestore } from "./firebase";

async function main() {
  const db = getFirestore();
  const snap = await db.collection("customers").limit(10).get();
  console.log("Connected. customers docs:", snap.size);
}

main().catch(console.error);
