import { z } from "zod";
import { nanoid } from "nanoid";
import { resolveWorkspaceId } from "~~/server/utils/workspace";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { TablesInsert } from "~/types/supabase.d";

import { cloneRepoFromTemplate } from "~~/server/utils/github";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  business_brief: z
    .object({
      business_name: z.string().min(2, 'Business name is required'),
      industry: z.enum([
        'law_firm',
        'dental_clinic',
        'medical_clinic',
        'accounting',
        'real_estate',
        'marketing_agency',
        'local_services',
        'ecommerce',
        'other'
      ]),
      location_market: z.string().min(2, 'Country is required'),
      main_service_product: z.string().min(1, 'Main service/product is required'),
      target_audience: z.object({
        primary: z.string().min(2, 'Primary audience is required'),
        secondary: z.string().optional()
      }),
      goals: z.object({
        primary_goal: z.string().min(1, 'Primary goal is required'),
        secondary_goals: z.array(z.string()).default([])
      }),
      languages: z.object({
        needed: z.array(z.enum(['en', 'he', 'ar'])).min(1, 'Pick at least one language'),
        default_language: z.enum(['en', 'he', 'ar']),
        rtl_support: z.boolean().default(true)
      })
    })
    .optional()
})


function slugify(input: string) {
  const hebrewMap: Record<string, string> = {
    א: 'a', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v',
    ז: 'z', ח: 'h', ט: 't', י: 'y', כ: 'k', ך: 'k',
    ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n', ס: 's',
    ע: 'a', פ: 'p', ף: 'p', צ: 'ts', ץ: 'ts',
    ק: 'k', ר: 'r', ש: 'sh', ת: 't'
  }

  const arabicMap: Record<string, string> = {
    ا: 'a', أ: 'a', إ: 'i', آ: 'a',
    ب: 'b', ت: 't', ث: 'th', ج: 'j',
    ح: 'h', خ: 'kh', د: 'd', ذ: 'dh',
    ر: 'r', ز: 'z', س: 's', ش: 'sh',
    ص: 's', ض: 'd', ط: 't', ظ: 'z',
    ع: 'a', غ: 'gh', ف: 'f', ق: 'q',
    ك: 'k', ل: 'l', م: 'm', ن: 'n',
    ه: 'h', و: 'w', ي: 'y'
  }

  const transliterate = (str: string) =>
    str
      .split('')
      .map((char) => {
        if (hebrewMap[char]) return hebrewMap[char]
        if (arabicMap[char]) return arabicMap[char]
        return char
      })
      .join('')

  return transliterate(input)
    .normalize('NFKD') // split accented letters
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + nanoid(6)
}

export default defineEventHandler(async (event) => {
  // ✅ User session comes from cookies via the Nuxt Supabase server helpers
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const result = schema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation error",
      data: result.error.message,
    });
  }


  const client = await serverSupabaseClient(event);

  const workspaceId = await resolveWorkspaceId(client, user as any);



  const name = result.data.name;
  const slug = slugify(name);





  const projectData: TablesInsert<"projects"> = {
    workspace_id: workspaceId,
    name,
    slug,
    description: result.data.description ?? null,
    status: result.data.status ?? "draft",
    repo: process.env.GITHUB_OWNER + '/' + slug,
    vercel_id: null,
    last_preview_url: null,
  };

  const { data, error } = await client
    .from("projects")
    .insert(projectData as any)
    .select()
    .single();




  if (error) {
    // slug unique violation
    if ((error as any).code === "23505") {
      throw createError({ statusCode: 409, message: "Slug already exists" });
    }
    throw createError({ statusCode: 500, message: error.message });
  }
  try {
    await cloneRepoFromTemplate({
      templateOwner: process.env.GITHUB_OWNER!,
      templateRepo: process.env.GITHUB_STARTER_TEMPLATE!,
      newRepo: slug,
      newOwner: process.env.GITHUB_OWNER!,
    })


    await setProjectDataByKey(event, (data as any).id, 'business_brief', result.data.business_brief)
  } catch (error) {
    createError({ statusCode: 500, message: (error as any).message })

  }



  return { item: data };
});
