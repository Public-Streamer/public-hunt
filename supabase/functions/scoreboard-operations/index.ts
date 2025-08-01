import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, eventId, teamName, teamColor, teamId, score } = await req.json()

    switch (action) {
      case 'fetch':
        const { data: teams, error: fetchError } = await supabaseClient
          .from('event_scoreboard')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError
        return new Response(JSON.stringify(teams), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'create':
        const { error: createError } = await supabaseClient
          .from('event_scoreboard')
          .insert({
            event_id: eventId,
            team_name: teamName,
            score: 0,
            team_color: teamColor,
          })

        if (createError) throw createError
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'updateScore':
        const { error: updateError } = await supabaseClient
          .from('event_scoreboard')
          .update({ score })
          .eq('id', teamId)

        if (updateError) throw updateError
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'delete':
        const { error: deleteError } = await supabaseClient
          .from('event_scoreboard')
          .delete()
          .eq('id', teamId)

        if (deleteError) throw deleteError
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})