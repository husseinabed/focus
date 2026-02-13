import { createMCPClient } from "@ai-sdk/mcp";
export const nuxtMCPClient = createMCPClient({
    name: "Nuxtjs",
    transport: {
        type: "http", // or "http", "ws" depending on your MCP server
        url: "https://nuxt.com/mcp"
    },
});

export const nuxtUIMCPClient = createMCPClient({
    name: "Nuxtjs",
    transport: {
        type: "http", // or "http", "ws" depending on your MCP server
        url: "https://ui.nuxt.com/mcp"
    },
});


 