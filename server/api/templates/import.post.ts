import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import { createError } from 'h3';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const workspaceId = user.app_metadata?.workspace_id;
  if (!workspaceId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Missing workspace ID or workspace_id in app_metadata',
    });
  }

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
      if (!template.name || !template.category || !template.language || !template.body) {
        throw new Error('Missing required fields (name, category, language, body) for a template.');
      }

      // Validate variables exist in body (simple check for now)
      const bodyVariables = (template.body.match(/{{([a-zA-Z0-9_.]+)}}/g) || []).map((v: string) => v.replace(/{{|}}/g, ''));
      const declaredVariables = Object.keys(template.variables || {});

      for (const varName of declaredVariables) {
        if (!bodyVariables.includes(varName) && !template.reserved_variables?.includes(varName)) { // Assuming reserved_variables are globally known or passed in
          // For now, we will allow custom variables to be declared without being in the body
          // This might be a more strict validation for the frontend or a later stage.
          // throw new Error(`Declared variable '${varName}' not found in template body.`);
        }
      }
      
      // Basic check for reserved variables that are not custom
      // This might need more sophisticated handling later to distinguish between user-defined custom vars and system-defined reserved vars
      const templateToInsert = {
        workspace_id: workspaceId,
        created_by: user.id,
        name: template.name,
        category: template.category,
        language: template.language,
        body: template.body,
        variables: template.variables || {},
        is_active: template.is_active !== undefined ? template.is_active : true,
      };

      const { data, error } = await client
        .from('templates')
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
