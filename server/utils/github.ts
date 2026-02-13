import { octokit } from "~~/server/utils/octokit";

export async function cloneRepoFromTemplate(options: {
    templateOwner: string;
    templateRepo: string;
    newOwner: string;
    newRepo: string;
    private?: boolean;
    description?: string;
}) {


    const res = await octokit.request(
        "POST /repos/{template_owner}/{template_repo}/generate",
        {
            template_owner: options.templateOwner,
            template_repo: options.templateRepo,
            owner: options.newOwner,
            name: options.newRepo,
            private: options.private ?? true,
            description: options.description,
            include_all_branches: false,
        }
    );

    return res.data;
}
