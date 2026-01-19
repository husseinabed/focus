import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import { resolveWorkspaceId } from '~~/server/utils/workspace';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const workspaceId = await resolveWorkspaceId(client, user);

  const body = await readBody(event);
  const { name, description, is_active, trigger_type } = body;

  if (!name || !trigger_type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and trigger_type are required.',
    });
  }

  // Insert into workflows table
  const { data: workflow, error: workflowError } = await client
    .from('workflows')
    .insert({
      workspace_id: workspaceId,
      name,
      description,
      is_active: is_active ?? false,
      trigger_type,
      created_by: user.id,
    })
    .select()
    .single();

  if (workflowError) {
    throw createError({
      statusCode: 500,
      statusMessage: workflowError.message,
    });
  }

  // Create initial workflow_version (v1)
  const { data: workflowVersion, error: versionError } = await client
    .from('workflow_versions')
    .insert({
      workflow_id: workflow.id,
      version: 1,
      graph: { nodes: [], edges: [] }, // Empty graph shell
      schema_version: 1,
      published: false,
      created_by: user.id,
    })
    .select()
    .single();

  if (versionError) {
    // If version creation fails, consider rolling back workflow creation or logging an error
    console.error("Failed to create initial workflow version:", versionError);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create initial workflow version.',
    });
  }

  return { ...workflow, current_version: workflowVersion };
});
