import { generateText, stepCountIs } from "ai";
import { google } from "~~/server/utils/google";

import { AiAgent } from "./agent.class";
import { parseJsonRaw } from "./json";

export const runAgent = async (agent: AiAgent, input: any, onEvent?: (event: any) => void) => {


    onEvent?.({ type: "agent_start", message: agent.name, paylod: { input } });

    const { text } = await generateText({
        model: google("gemini-flash-latest"),
        prompt: JSON.stringify(input),
        system: agent.system,
        tools: agent.tools,
        onStepFinish({ content }) {
            content.forEach((c) => onEvent?.(c));
        },
        stopWhen: stepCountIs(80),
    });

    let output = {};
    try {
        output = parseJsonRaw(text);
    } catch (e) {
        output = text;
    }


    onEvent?.({ type: "agent_end", message: agent.name, paylod: { output } });
    return output;
}