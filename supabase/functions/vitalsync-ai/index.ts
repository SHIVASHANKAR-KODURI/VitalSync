// @ts-nocheck
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

/*
 * Current stable low-latency Gemini model.
 */
const GEMINI_MODEL = 'gemini-3.5-flash-lite'

function json(data: unknown, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: corsHeaders
    }
  )
}

function base64FromBytes(bytes: Uint8Array) {
  let binary = ''

  const chunk = 0x8000

  for (
    let i = 0;
    i < bytes.length;
    i += chunk
  ) {
    binary += String.fromCharCode(
      ...bytes.subarray(
        i,
        Math.min(i + chunk, bytes.length)
      )
    )
  }

  return btoa(binary)
}

Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response(
      'ok',
      {
        headers: corsHeaders
      }
    )
  }

  if (req.method !== 'POST') {
    return json(
      {
        error: 'POST required'
      },
      405
    )
  }


  const authHeader =
    req.headers.get('Authorization')

  if (!authHeader) {
    return json(
      {
        error: 'Authentication required'
      },
      401
    )
  }


  const supabaseUrl =
    Deno.env.get('SUPABASE_URL')!

  const publishable =
    Deno.env.get('SUPABASE_ANON_KEY') ||
    (() => {

      try {

        return JSON.parse(
          Deno.env.get(
            'SUPABASE_PUBLISHABLE_KEYS'
          ) || '{}'
        ).default

      } catch {

        return ''
      }

    })()


  const supabase =
    createClient(
      supabaseUrl,
      publishable,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )


  const {
    data: {
      user
    },
    error: userError
  } =
    await supabase.auth.getUser()


  if (
    userError ||
    !user
  ) {

    return json(
      {
        error: 'Invalid session'
      },
      401
    )
  }


  const geminiKey =
    Deno.env.get(
      'GEMINI_API_KEY'
    )


  if (!geminiKey) {

    return json(
      {
        error:
          'GEMINI_API_KEY is not configured in Supabase Edge Function secrets.'
      },
      500
    )
  }


  try {

    const body =
      await req.json()

    const action =
      body.action

    let contents: any[] = []


    /* =====================================================
       CLINICAL REPORT ANALYSIS
    ===================================================== */

    if (
      action === 'vision'
    ) {

      const storagePath =
        String(
          body.storagePath || ''
        )

      const mimeType =
        String(
          body.mimeType ||
          'application/octet-stream'
        )


      if (
        !storagePath.startsWith(
          `${user.id}/`
        )
      ) {

        return json(
          {
            error:
              'Invalid report path'
          },
          400
        )
      }


      const {
        data: file,
        error
      } =
        await supabase.storage
          .from(
            'clinical-reports'
          )
          .download(
            storagePath
          )


      if (
        error ||
        !file
      ) {

        return json(
          {
            error:
              error?.message ||
              'Could not read report'
          },
          400
        )
      }


      const bytes =
        new Uint8Array(
          await file.arrayBuffer()
        )


      const prompt = `
You are the VitalSync Health Report Analyst.

Analyze this uploaded clinical report.

Summarize important findings in simple language.

Clearly separate:

Summary
Key Findings
Next Step

Highlight abnormal or out-of-range values when visible.

Do not diagnose.
Do not prescribe medication.
Do not claim certainty.

Recommend discussing concerning findings with a qualified clinician.

Keep the response concise.
`


      contents = [
        {
          role: 'user',

          parts: [
            {
              text: prompt
            },

            {
              inlineData: {
                mimeType,
                data:
                  base64FromBytes(
                    bytes
                  )
              }
            }
          ]
        }
      ]


    } else {

      /* ===================================================
         CHAT
      =================================================== */

      const prompt =
        String(
          body.prompt || ''
        )


      if (!prompt) {

        return json(
          {
            error:
              'Prompt is required'
          },
          400
        )
      }


      const history =
        Array.isArray(
          body.history
        )
          ? body.history
          : []


      contents =
        history.map(
          (item: any) => ({
            role:
              item.role === 'model'
                ? 'model'
                : 'user',

            parts: [
              {
                text:
                  String(
                    item.text || ''
                  )
              }
            ]
          })
        )


      contents.push({
        role: 'user',

        parts: [
          {
            text: prompt
          }
        ]
      })
    }


    /* =====================================================
       GEMINI REQUEST
    ===================================================== */

    const response =
      await fetch(

        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
          geminiKey
        )}`,

        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              contents,

              generationConfig: {
                maxOutputTokens: 700
              }
            })
        }
      )


    const data =
      await response.json()


    if (
      !response.ok
    ) {

      console.error(
        'Gemini error',
        response.status,
        data
      )


      return json(
        {
          error:
            data?.error?.message ||
            `Gemini request failed (${response.status})`
        },
        response.status
      )
    }


    const text =
      data
        ?.candidates?.[0]
        ?.content?.parts
        ?.map(
          (part: any) =>
            part.text || ''
        )
        .join('') ||
      'No AI response was generated.'


    return json({
      text
    })


  } catch (error) {

    console.error(
      'vitalsync-ai error',
      error
    )


    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected server error'
      },
      500
    )
  }
})