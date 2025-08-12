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

  const { action, eventId, teamName, teamColor, teamId, score, custom_fields, pinnedMessage, pinnedMessages, messageId, newOrder, scoreboardType, timers } = await req.json()

    // Auth client bound to requester to enforce permissions
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      anonKey,
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
    )

    const { data: userData } = await authClient.auth.getUser()
    const user = userData?.user

    const isHostForEvent = async (eId: string, uid: string) => {
      const { data } = await authClient.from('events').select('created_by').eq('id', eId).maybeSingle()
      return data?.created_by === uid
    }

    const isJudgeForEvent = async (eId: string, uid: string) => {
      const { data } = await authClient
        .from('event_streamers')
        .select('permissions, streamer_id')
        .eq('event_id', eId)
        .eq('streamer_id', uid)
        .maybeSingle()
      const perms: string[] = (data?.permissions as any) || []
      return Array.isArray(perms) && perms.includes('scorecard_judge')
    }

    const getEventIdByTeam = async (tId: string) => {
      const { data, error } = await supabaseClient.from('event_scoreboard').select('event_id').eq('id', tId).single()
      if (error) throw error
      return data.event_id as string
    }

    const assertCanJudge = async (eId: string) => {
      if (!user?.id) return false
      if (await isHostForEvent(eId, user.id)) return true
      if (await isJudgeForEvent(eId, user.id)) return true
      return false
    }


    switch (action) {
      case 'fetch':
        const requestedType = scoreboardType || 'coon_hunt'
        const { data: teams, error: fetchError } = await supabaseClient
          .from('event_scoreboard')
          .select('*')
          .eq('event_id', eventId)
          .eq('scoreboard_type', requestedType)
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError
        return new Response(JSON.stringify(teams), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'create':
        {
          const createType = scoreboardType || 'coon_hunt'
          if (!(await assertCanJudge(eventId))) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
          const { error: createError } = await supabaseClient
            .from('event_scoreboard')
            .insert({
              event_id: eventId,
              team_name: teamName,
              score: 0,
              team_color: teamColor,
              custom_fields: custom_fields || {},
              scoreboard_type: createType,
            })

          if (createError) throw createError
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'updateScore':
        {
          const eId = await getEventIdByTeam(teamId)
          if (!(await assertCanJudge(eId))) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
          const { error: updateError } = await supabaseClient
            .from('event_scoreboard')
            .update({ score })
            .eq('id', teamId)

          if (updateError) throw updateError
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'updateTeam':
        {
          const eId = await getEventIdByTeam(teamId)
          if (!(await assertCanJudge(eId))) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
          const { error: updateTeamError } = await supabaseClient
            .from('event_scoreboard')
            .update({
              team_name: teamName,
              score: score,
              team_color: teamColor,
              custom_fields: custom_fields || {}
            })
            .eq('id', teamId)

          if (updateTeamError) throw updateTeamError
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'delete':
        {
          const eId = await getEventIdByTeam(teamId)
          if (!(await assertCanJudge(eId))) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
          const { error: deleteError } = await supabaseClient
            .from('event_scoreboard')
            .delete()
            .eq('id', teamId)

          if (deleteError) throw deleteError
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'deleteAll':
        {
          const deleteType = scoreboardType || 'coon_hunt'
          if (!(await assertCanJudge(eventId))) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
          const { error: deleteAllError } = await supabaseClient
            .from('event_scoreboard')
            .delete()
            .eq('event_id', eventId)
            .eq('scoreboard_type', deleteType)

          if (deleteAllError) throw deleteAllError
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'fetchPinnedMessage':
        const { data: eventData, error: eventError } = await supabaseClient
          .from('events')
          .select('pinned_message')
          .eq('id', eventId)
          .single()

        if (eventError) throw eventError
        
        // Handle both old single message format and new multiple messages format
        let messages = []
        if (eventData.pinned_message) {
          try {
            // Try to parse as JSON array (new format)
            messages = JSON.parse(eventData.pinned_message)
            if (!Array.isArray(messages)) {
              // If it's not an array, treat as single message (old format)
              messages = [{ id: '1', content: eventData.pinned_message, order: 0 }]
            }
          } catch {
            // If parsing fails, treat as single message (old format)
            messages = [{ id: '1', content: eventData.pinned_message, order: 0 }]
          }
        }
        
        return new Response(JSON.stringify({ messages }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'updatePinnedMessage':
        // Legacy support for single message updates
        const { error: updatePinnedError } = await supabaseClient
          .from('events')
          .update({ pinned_message: pinnedMessage })
          .eq('id', eventId)

        if (updatePinnedError) throw updatePinnedError
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'updatePinnedMessages':
        const { error: updateMessagesError } = await supabaseClient
          .from('events')
          .update({ pinned_message: JSON.stringify(pinnedMessages) })
          .eq('id', eventId)

        if (updateMessagesError) throw updateMessagesError
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'addPinnedMessage':
        // Fetch current messages
        const { data: currentEventData, error: fetchCurrentError } = await supabaseClient
          .from('events')
          .select('pinned_message')
          .eq('id', eventId)
          .single()

        if (fetchCurrentError) throw fetchCurrentError

        let currentMessages = []
        if (currentEventData.pinned_message) {
          try {
            currentMessages = JSON.parse(currentEventData.pinned_message)
            if (!Array.isArray(currentMessages)) {
              currentMessages = [{ id: '1', content: currentEventData.pinned_message, order: 0 }]
            }
          } catch {
            currentMessages = [{ id: '1', content: currentEventData.pinned_message, order: 0 }]
          }
        }

        // Add new message
        const newMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: pinnedMessage,
          order: currentMessages.length
        }
        currentMessages.push(newMessage)

        const { error: addMessageError } = await supabaseClient
          .from('events')
          .update({ pinned_message: JSON.stringify(currentMessages) })
          .eq('id', eventId)

        if (addMessageError) throw addMessageError
        return new Response(JSON.stringify({ success: true, message: newMessage }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'updateSinglePinnedMessage':
        // Fetch current messages
        const { data: updateEventData, error: fetchUpdateError } = await supabaseClient
          .from('events')
          .select('pinned_message')
          .eq('id', eventId)
          .single()

        if (fetchUpdateError) throw fetchUpdateError

        let updateMessages = []
        if (updateEventData.pinned_message) {
          try {
            updateMessages = JSON.parse(updateEventData.pinned_message)
            if (!Array.isArray(updateMessages)) {
              updateMessages = [{ id: '1', content: updateEventData.pinned_message, order: 0 }]
            }
          } catch {
            updateMessages = [{ id: '1', content: updateEventData.pinned_message, order: 0 }]
          }
        }

        // Update specific message
        updateMessages = updateMessages.map(msg => 
          msg.id === messageId ? { ...msg, content: pinnedMessage } : msg
        )

        const { error: updateSingleError } = await supabaseClient
          .from('events')
          .update({ pinned_message: JSON.stringify(updateMessages) })
          .eq('id', eventId)

        if (updateSingleError) throw updateSingleError
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'deletePinnedMessage':
        // Fetch current messages
        const { data: deleteEventData, error: fetchDeleteError } = await supabaseClient
          .from('events')
          .select('pinned_message')
          .eq('id', eventId)
          .single()

        if (fetchDeleteError) throw fetchDeleteError

        let deleteMessages = []
        if (deleteEventData.pinned_message) {
          try {
            deleteMessages = JSON.parse(deleteEventData.pinned_message)
            if (!Array.isArray(deleteMessages)) {
              deleteMessages = [{ id: '1', content: deleteEventData.pinned_message, order: 0 }]
            }
          } catch {
            deleteMessages = [{ id: '1', content: deleteEventData.pinned_message, order: 0 }]
          }
        }

        // Remove specific message
        deleteMessages = deleteMessages.filter(msg => msg.id !== messageId)

        const { error: deleteMessageError } = await supabaseClient
          .from('events')
          .update({ pinned_message: deleteMessages.length > 0 ? JSON.stringify(deleteMessages) : null })
          .eq('id', eventId)

        if (deleteMessageError) throw deleteMessageError
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'reorderPinnedMessages':
        const { error: reorderError } = await supabaseClient
          .from('events')
          .update({ pinned_message: JSON.stringify(newOrder) })
          .eq('id', eventId)

        if (reorderError) throw reorderError
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'updateDogTimers': {
        const eId = await getEventIdByTeam(teamId)
        if (!(await assertCanJudge(eId))) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
        const nowIso = new Date().toISOString()
        const { data: teamRow, error: teamFetchError } = await supabaseClient
          .from('event_scoreboard')
          .select('custom_fields')
          .eq('id', teamId)
          .single()
        if (teamFetchError) throw teamFetchError
        const current = (teamRow?.custom_fields as any) || {}
        const updated = {
          ...current,
          timers: { ...(current.timers || {}), ...(timers || {}) },
          timers_server_updated_at: nowIso,
        }
        const { error: teamUpdateError } = await supabaseClient
          .from('event_scoreboard')
          .update({ custom_fields: updated })
          .eq('id', teamId)
        if (teamUpdateError) throw teamUpdateError
        return new Response(JSON.stringify({ success: true, serverUpdatedAt: nowIso }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'updateCastTimers': {
        if (!(await assertCanJudge(eventId))) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
        const nowIso = new Date().toISOString()
        const { data: evRow, error: evFetchError } = await supabaseClient
          .from('events')
          .select('metadata')
          .eq('id', eventId)
          .single()
        if (evFetchError) throw evFetchError
        const meta = (evRow?.metadata as any) || {}
        const updatedMeta = {
          ...meta,
          scorecard_cast_timers: { ...(timers || {}), server_updated_at: nowIso },
        }
        const { error: evUpdateError } = await supabaseClient
          .from('events')
          .update({ metadata: updatedMeta })
          .eq('id', eventId)
        if (evUpdateError) throw evUpdateError
        return new Response(JSON.stringify({ success: true, serverUpdatedAt: nowIso }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})