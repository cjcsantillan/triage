#!/usr/bin/env node
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { triageTicket, BedrockInvocationError } from "../lib/triageService.js";

const program = new Command();

program
  .name("triage")
  .description("Triage a support ticket from the terminal using Amazon Bedrock.")
  .argument("[ticket]", "ticket text; omit to read from --file or stdin")
  .option("-f, --file <path>", "read ticket text from a file instead of an argument")
  .option("--json", "print raw JSON instead of formatted output")
  .action(async (ticketArg: string | undefined, opts: { file?: string; json?: boolean }) => {
    const ticket = await resolveTicketText(ticketArg, opts.file);

    if (!ticket) {
      console.error("No ticket text provided. Pass it as an argument, --file <path>, or via stdin.");
      process.exitCode = 1;
      return;
    }

    try {
      const result = await triageTicket(ticket);
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      printResult(ticket, result);
    } catch (err) {
      if (err instanceof BedrockInvocationError) {
        console.error(`triage: ${err.message}`);
        process.exitCode = 1;
        return;
      }
      throw err;
    }
  });

async function resolveTicketText(arg: string | undefined, filePath: string | undefined) {
  if (arg) return arg.trim();
  if (filePath) return readFileSync(filePath, "utf-8").trim();
  if (!process.stdin.isTTY) return readStdin();
  return undefined;
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.trim()));
    process.stdin.on("error", reject);
  });
}

function printResult(ticket: string, { urgency, category, reply }: { urgency: string; category: string; reply: string }) {
  console.log(`\n"${ticket}"\n`);
  console.log(`  urgency   ${urgency}`);
  console.log(`  category  ${category}`);
  console.log(`\n  reply\n  ${reply.replace(/\n/g, "\n  ")}\n`);
}

program.parseAsync(process.argv);
