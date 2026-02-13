
export function sanitizeVercelProjectName(input: string): string {
    let name = input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9._-]+/g, "-") // replace invalid chars
        .replace(/-+/g, "-");          // collapse multiple dashes

    // ❌ remove forbidden triple-dash sequence
    while (name.includes("---")) {
        name = name.replace(/---/g, "--");
    }

    // trim invalid edges
    name = name.replace(/^[-._]+|[-._]+$/g, "");

    // enforce length
    if (name.length > 100) {
        name = name.slice(0, 100).replace(/^[-._]+|[-._]+$/g, "");
    }

    // absolute fallback (Vercel-safe)
    if (!name) {
        name = `project-${Date.now().toString(36)}`;
    }

    return name;
}
