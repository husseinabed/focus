import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import { createError } from 'h3';
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

  const workspaceId = user.app_metadata?.workspace_id || await resolveWorkspaceId(client, user);

  const templatesToImport = await readBody(event);

  if (!Array.isArray(templatesToImport)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Expected an array of templates',
    });
  }

  const importedTemplates = [];
  const errors = [];

  for (const template of templatesToImport) {
    try {
      if (!template.title || !template.category || !template.channel || !template.status || !template.locales) {
        throw new Error('Missing required fields (title, category, channel, status, locales) for a template.');
      }

      const key = template.key || `${template.title}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const templateToInsert = {
        workspace_id: workspaceId,
        key,
        title: template.title,
        category: template.category,
        channel: template.channel,
        status: template.status,
        locales: template.locales,
        variants: template.variants || {},
        variables_schema: template.variables_schema || {},
        defaults: template.defaults || {},
        rules: template.rules || {},
        compliance: template.compliance || {},
        tags: template.tags || [],
      };

      const { data, error } = await client
        .from('content_templates')
        .insert(templateToInsert)
        .select();

      if (error) {
        throw new Error(error.message);
      }
      importedTemplates.push(data[0]);
    } catch (e: any) {
      errors.push({ template: template.name, error: e.message });
    }
  }

  return { imported: importedTemplates.length, errors: errors.length, details: { importedTemplates, errors } };
});
