import dotenv from "dotenv";
dotenv.config();

async function main() {
  await import("./index");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
