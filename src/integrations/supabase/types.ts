export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ad_feedback: {
        Row: {
          ad_id: string
          created_at: string
          feedback_text: string | null
          id: string
          impression_at_2s: boolean | null
          is_flagged: boolean | null
          is_moderated: boolean | null
          selected_tags: string[] | null
          skip_clicked: boolean | null
          star_rating: number
          updated_at: string
          user_agent: string | null
          view_duration_seconds: number | null
          viewer_ip: string | null
          viewer_session_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          impression_at_2s?: boolean | null
          is_flagged?: boolean | null
          is_moderated?: boolean | null
          selected_tags?: string[] | null
          skip_clicked?: boolean | null
          star_rating: number
          updated_at?: string
          user_agent?: string | null
          view_duration_seconds?: number | null
          viewer_ip?: string | null
          viewer_session_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          impression_at_2s?: boolean | null
          is_flagged?: boolean | null
          is_moderated?: boolean | null
          selected_tags?: string[] | null
          skip_clicked?: boolean | null
          star_rating?: number
          updated_at?: string
          user_agent?: string | null
          view_duration_seconds?: number | null
          viewer_ip?: string | null
          viewer_session_id?: string
        }
        Relationships: []
      }
      ad_impressions: {
        Row: {
          ad_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          impression_time: string | null
          skip_clicked: boolean | null
          stream_name: string | null
          user_agent: string | null
          view_duration_seconds: number | null
          viewed_at_2s: boolean | null
          viewer_ip: string | null
          viewer_session_id: string
        }
        Insert: {
          ad_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          impression_time?: string | null
          skip_clicked?: boolean | null
          stream_name?: string | null
          user_agent?: string | null
          view_duration_seconds?: number | null
          viewed_at_2s?: boolean | null
          viewer_ip?: string | null
          viewer_session_id: string
        }
        Update: {
          ad_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          impression_time?: string | null
          skip_clicked?: boolean | null
          stream_name?: string | null
          user_agent?: string | null
          view_duration_seconds?: number | null
          viewed_at_2s?: boolean | null
          viewer_ip?: string | null
          viewer_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_user_assignments: {
        Row: {
          activated_at: string | null
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          actual_impressions: number | null
          ad_name: string | null
          ad_type: string | null
          budget: number
          budget_remaining: number | null
          campaign_status: string | null
          cpm_rate: number | null
          created_at: string
          creative_valid: boolean | null
          cta_label: string | null
          cta_url: string | null
          daily_cap: number | null
          description: string | null
          end_date: string | null
          estimated_impressions: number | null
          id: string
          skip_after_seconds: number | null
          spend_amount: number | null
          start_date: string | null
          status: string | null
          stripe_account_id: string | null
          target_channels: string[] | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
          viewed_duration: number | null
        }
        Insert: {
          actual_impressions?: number | null
          ad_name?: string | null
          ad_type?: string | null
          budget: number
          budget_remaining?: number | null
          campaign_status?: string | null
          cpm_rate?: number | null
          created_at?: string
          creative_valid?: boolean | null
          cta_label?: string | null
          cta_url?: string | null
          daily_cap?: number | null
          description?: string | null
          end_date?: string | null
          estimated_impressions?: number | null
          id?: string
          skip_after_seconds?: number | null
          spend_amount?: number | null
          start_date?: string | null
          status?: string | null
          stripe_account_id?: string | null
          target_channels?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          viewed_duration?: number | null
        }
        Update: {
          actual_impressions?: number | null
          ad_name?: string | null
          ad_type?: string | null
          budget?: number
          budget_remaining?: number | null
          campaign_status?: string | null
          cpm_rate?: number | null
          created_at?: string
          creative_valid?: boolean | null
          cta_label?: string | null
          cta_url?: string | null
          daily_cap?: number | null
          description?: string | null
          end_date?: string | null
          estimated_impressions?: number | null
          id?: string
          skip_after_seconds?: number | null
          spend_amount?: number | null
          start_date?: string | null
          status?: string | null
          stripe_account_id?: string | null
          target_channels?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          viewed_duration?: number | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          created_at: string | null
          id: number
          likes: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          author: string
          created_at?: string | null
          id?: number
          likes?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          created_at?: string | null
          id?: number
          likes?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      channel_permissions: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          channel_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["channel_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          channel_id: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["channel_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          channel_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["channel_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_permissions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_subscribers: {
        Row: {
          channel_id: string
          id: string
          subscribed_at: string | null
          subscriber_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          subscribed_at?: string | null
          subscriber_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          subscribed_at?: string | null
          subscriber_id?: string
        }
        Relationships: []
      }
      channel_subscriptions: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          media_urls: string[] | null
          name: string
          owner_email: string | null
          owner_first_name: string | null
          owner_last_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          media_urls?: string[] | null
          name: string
          owner_email?: string | null
          owner_first_name?: string | null
          owner_last_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          media_urls?: string[] | null
          name?: string
          owner_email?: string | null
          owner_first_name?: string | null
          owner_last_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          is_like: boolean | null
          user_profile_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          is_like?: boolean | null
          user_profile_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          is_like?: boolean | null
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_avatar: string | null
          author_name: string
          author_username: string
          content: string
          created_at: string | null
          dislikes_count: number | null
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string | null
          user_profile_id: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          author_username: string
          content: string
          created_at?: string | null
          dislikes_count?: number | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string | null
          user_profile_id?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          author_username?: string
          content?: string
          created_at?: string | null
          dislikes_count?: number | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string | null
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          company_id: string
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          cover_photo_url: string | null
          created_at: string | null
          description: string | null
          employee_count: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          industry: string | null
          logo_url: string | null
          social_links: Json | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          company_id: string
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          employee_count?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          social_links?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          company_id?: string
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          employee_count?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          social_links?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          company_id: string
          created_at: string | null
          id: string
          permissions: string[] | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      episode_clips: {
        Row: {
          clip_order: number
          clip_title: string
          clip_type: string | null
          created_at: string
          end_time_seconds: number
          engagement_score: number | null
          episode_id: string
          highlight_type: string | null
          id: string
          start_time_seconds: number
          updated_at: string
        }
        Insert: {
          clip_order: number
          clip_title: string
          clip_type?: string | null
          created_at?: string
          end_time_seconds: number
          engagement_score?: number | null
          episode_id: string
          highlight_type?: string | null
          id?: string
          start_time_seconds: number
          updated_at?: string
        }
        Update: {
          clip_order?: number
          clip_title?: string
          clip_type?: string | null
          created_at?: string
          end_time_seconds?: number
          engagement_score?: number | null
          episode_id?: string
          highlight_type?: string | null
          id?: string
          start_time_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_clips_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          channel_id: string | null
          created_at: string
          creator_id: string
          current_length_minutes: number | null
          description: string | null
          id: string
          likes_count: number | null
          metadata: Json | null
          published_at: string | null
          source_event_id: string | null
          status: string
          target_length_minutes: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          creator_id: string
          current_length_minutes?: number | null
          description?: string | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          published_at?: string | null
          source_event_id?: string | null
          status?: string
          target_length_minutes?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          creator_id?: string
          current_length_minutes?: number | null
          description?: string | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          published_at?: string | null
          source_event_id?: string | null
          status?: string
          target_length_minutes?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ad_sessions: {
        Row: {
          ad_id: string
          billing_amount: number | null
          created_at: string
          duration_seconds: number | null
          event_id: string
          id: string
          session_end: string | null
          session_start: string
          status: string | null
          triggered_by: string
          updated_at: string
          viewer_count: number | null
        }
        Insert: {
          ad_id: string
          billing_amount?: number | null
          created_at?: string
          duration_seconds?: number | null
          event_id: string
          id?: string
          session_end?: string | null
          session_start?: string
          status?: string | null
          triggered_by: string
          updated_at?: string
          viewer_count?: number | null
        }
        Update: {
          ad_id?: string
          billing_amount?: number | null
          created_at?: string
          duration_seconds?: number | null
          event_id?: string
          id?: string
          session_end?: string | null
          session_start?: string
          status?: string | null
          triggered_by?: string
          updated_at?: string
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_ad_sessions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_ad_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_channel_requests: {
        Row: {
          channel_id: string
          created_at: string | null
          event_id: string
          id: string
          message: string | null
          requested_at: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          event_id: string
          id?: string
          message?: string | null
          requested_at?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          event_id?: string
          id?: string
          message?: string | null
          requested_at?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_channel_requests_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_channel_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_chat_messages: {
        Row: {
          created_at: string | null
          display_name: string
          event_id: string
          id: string
          message: string
          message_type: string | null
          profile_picture_url: string | null
          sequence_number: number | null
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          event_id: string
          id?: string
          message: string
          message_type?: string | null
          profile_picture_url?: string | null
          sequence_number?: number | null
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          event_id?: string
          id?: string
          message?: string
          message_type?: string | null
          profile_picture_url?: string | null
          sequence_number?: number | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_chat_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          author_avatar: string | null
          author_name: string
          content: string
          created_at: string
          event_id: string
          id: string
          parent_comment_id: string | null
          reply_count: number
          updated_at: string
          user_profile_id: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          content: string
          created_at?: string
          event_id: string
          id?: string
          parent_comment_id?: string | null
          reply_count?: number
          updated_at?: string
          user_profile_id?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          parent_comment_id?: string | null
          reply_count?: number
          updated_at?: string
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "event_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_likes: {
        Row: {
          created_at: string
          display_name: string
          event_id: string
          id: string
          user_id: string
          user_profile_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          event_id: string
          id?: string
          user_id: string
          user_profile_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          event_id?: string
          id?: string
          user_id?: string
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_likes_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          event_id: string
          id: string
          is_active: boolean | null
          is_live: boolean | null
          joined_at: string | null
          last_seen: string | null
          livekit_token: string | null
          permissions: string[] | null
          role: string
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          is_active?: boolean | null
          is_live?: boolean | null
          joined_at?: string | null
          last_seen?: string | null
          livekit_token?: string | null
          permissions?: string[] | null
          role: string
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          is_active?: boolean | null
          is_live?: boolean | null
          joined_at?: string | null
          last_seen?: string | null
          livekit_token?: string | null
          permissions?: string[] | null
          role?: string
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reports: {
        Row: {
          created_at: string
          event_id: string
          id: string
          reason_category: Database["public"]["Enums"]["report_reason"]
          reason_text: string | null
          reporter_ip: string | null
          reporter_user_id: string
          status: Database["public"]["Enums"]["report_status"]
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          reason_category: Database["public"]["Enums"]["report_reason"]
          reason_text?: string | null
          reporter_ip?: string | null
          reporter_user_id: string
          status?: Database["public"]["Enums"]["report_status"]
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          reason_category?: Database["public"]["Enums"]["report_reason"]
          reason_text?: string | null
          reporter_ip?: string | null
          reporter_user_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_scoreboard: {
        Row: {
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          event_id: string
          id: string
          is_editable: boolean | null
          score: number
          scoreboard_type: string | null
          team_color: string | null
          team_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          event_id: string
          id?: string
          is_editable?: boolean | null
          score?: number
          scoreboard_type?: string | null
          team_color?: string | null
          team_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          event_id?: string
          id?: string
          is_editable?: boolean | null
          score?: number
          scoreboard_type?: string | null
          team_color?: string | null
          team_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_scoreboard_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_streamers: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          camera_name: string | null
          event_id: string
          id: string
          permissions: string[] | null
          role_type: string | null
          streamer_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          camera_name?: string | null
          event_id: string
          id?: string
          permissions?: string[] | null
          role_type?: string | null
          streamer_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          camera_name?: string | null
          event_id?: string
          id?: string
          permissions?: string[] | null
          role_type?: string | null
          streamer_id?: string
        }
        Relationships: []
      }
      event_streams: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          is_active: boolean | null
          livekit_track_sid: string | null
          quality_settings: Json | null
          stream_name: string
          stream_type: string | null
          streamer_counts: number
          streamer_id: string | null
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          livekit_track_sid?: string | null
          quality_settings?: Json | null
          stream_name: string
          stream_type?: string | null
          streamer_counts?: number
          streamer_id?: string | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          livekit_track_sid?: string | null
          quality_settings?: Json | null
          stream_name?: string
          stream_type?: string | null
          streamer_counts?: number
          streamer_id?: string | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_streams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          channel_id: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          id: string
          is_live: boolean | null
          livekit_room_name: string | null
          location: string | null
          max_participants: number | null
          media_urls: string[] | null
          metadata: Json | null
          name: string
          payment_enabled: boolean | null
          pinned_message: string | null
          report_count: number
          slug: string | null
          slug_counter: number | null
          stream_quality: string | null
          stream_url: string | null
          stripe_account_id: string | null
          ticket_price: number | null
          time: string | null
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          category?: string | null
          channel_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          is_live?: boolean | null
          livekit_room_name?: string | null
          location?: string | null
          max_participants?: number | null
          media_urls?: string[] | null
          metadata?: Json | null
          name: string
          payment_enabled?: boolean | null
          pinned_message?: string | null
          report_count?: number
          slug?: string | null
          slug_counter?: number | null
          stream_quality?: string | null
          stream_url?: string | null
          stripe_account_id?: string | null
          ticket_price?: number | null
          time?: string | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          category?: string | null
          channel_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          is_live?: boolean | null
          livekit_room_name?: string | null
          location?: string | null
          max_participants?: number | null
          media_urls?: string[] | null
          metadata?: Json | null
          name?: string
          payment_enabled?: boolean | null
          pinned_message?: string | null
          report_count?: number
          slug?: string | null
          slug_counter?: number | null
          stream_quality?: string | null
          stream_url?: string | null
          stripe_account_id?: string | null
          ticket_price?: number | null
          time?: string | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_created_by_user_profiles"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      host_earnings: {
        Row: {
          ad_session_id: string
          created_at: string
          earning_amount: number
          earning_percentage: number
          event_id: string
          host_user_id: string
          id: string
          payout_date: string | null
          payout_status: string | null
          updated_at: string
        }
        Insert: {
          ad_session_id: string
          created_at?: string
          earning_amount?: number
          earning_percentage?: number
          event_id: string
          host_user_id: string
          id?: string
          payout_date?: string | null
          payout_status?: string | null
          updated_at?: string
        }
        Update: {
          ad_session_id?: string
          created_at?: string
          earning_amount?: number
          earning_percentage?: number
          event_id?: string
          host_user_id?: string
          id?: string
          payout_date?: string | null
          payout_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_earnings_ad_session_id_fkey"
            columns: ["ad_session_id"]
            isOneToOne: false
            referencedRelation: "event_ad_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_earnings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      host_stripe_accounts: {
        Row: {
          account_status: string | null
          created_at: string | null
          id: string
          onboarding_completed: boolean | null
          payouts_enabled: boolean | null
          stripe_account_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_status?: string | null
          created_at?: string | null
          id?: string
          onboarding_completed?: boolean | null
          payouts_enabled?: boolean | null
          stripe_account_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_status?: string | null
          created_at?: string | null
          id?: string
          onboarding_completed?: boolean | null
          payouts_enabled?: boolean | null
          stripe_account_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          created_at: string
          document_type: string
          document_version: string
          email: string
          id: string
          ip_address: string | null
          signature: string
          signed_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string
          document_version?: string
          email: string
          id?: string
          ip_address?: string | null
          signature: string
          signed_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          document_version?: string
          email?: string
          id?: string
          ip_address?: string | null
          signature?: string
          signed_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      newsfeed_items: {
        Row: {
          attendees: number | null
          author_avatar: string | null
          author_name: string
          author_username: string
          category: string | null
          channel_id: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          event_id: string | null
          friend_user_id: string | null
          id: string
          likes: number | null
          price: number | null
          shares: number | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          attendees?: number | null
          author_avatar?: string | null
          author_name: string
          author_username: string
          category?: string | null
          channel_id?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          event_id?: string | null
          friend_user_id?: string | null
          id?: string
          likes?: number | null
          price?: number | null
          shares?: number | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          attendees?: number | null
          author_avatar?: string | null
          author_name?: string
          author_username?: string
          category?: string | null
          channel_id?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          event_id?: string | null
          friend_user_id?: string | null
          id?: string
          likes?: number | null
          price?: number | null
          shares?: number | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_total: number
          created_at: string | null
          host_revenue: number
          id: string
          platform_fee: number
          processed_at: string | null
          status: string | null
          stripe_payment_intent_id: string
          ticket_id: string
        }
        Insert: {
          amount_total: number
          created_at?: string | null
          host_revenue: number
          id?: string
          platform_fee: number
          processed_at?: string | null
          status?: string | null
          stripe_payment_intent_id: string
          ticket_id: string
        }
        Update: {
          amount_total?: number
          created_at?: string | null
          host_revenue?: number
          id?: string
          platform_fee?: number
          processed_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      post_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stream_analytics: {
        Row: {
          event_id: string
          id: string
          metric_type: string
          metric_value: Json | null
          recorded_at: string | null
          stream_id: string | null
        }
        Insert: {
          event_id: string
          id?: string
          metric_type: string
          metric_value?: Json | null
          recorded_at?: string | null
          stream_id?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          metric_type?: string
          metric_value?: Json | null
          recorded_at?: string | null
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "event_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          amount: number
          created_at: string | null
          event_id: string
          id: string
          payment_id: string
          purchased_at: string | null
          qr_code: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          user_id: string | null
          verification_status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          event_id: string
          id?: string
          payment_id: string
          purchased_at?: string | null
          qr_code?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          event_id?: string
          id?: string
          payment_id?: string
          purchased_at?: string | null
          qr_code?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          following_type: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          following_type: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          following_type?: string
          id?: string
        }
        Relationships: []
      }
      user_friends: {
        Row: {
          created_at: string | null
          friend_id: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          friend_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          friend_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tagged_by: string
          tagged_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tagged_by: string
          tagged_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tagged_by?: string
          tagged_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_posts: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          channel_id: string | null
          comments: number | null
          content: string
          created_at: string | null
          event_id: string | null
          id: string
          likes: number | null
          location: string | null
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          post_type: string | null
          shares: number
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string | null
          channel_id?: string | null
          comments?: number | null
          content: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          likes?: number | null
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          post_type?: string | null
          shares?: number
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string | null
          channel_id?: string | null
          comments?: number | null
          content?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          likes?: number | null
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          post_type?: string | null
          shares?: number
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          bio: string | null
          birthday: string | null
          company_id: string | null
          company_name: string | null
          cover_photo_url: string | null
          created_at: string | null
          display_name: string | null
          education: string | null
          followers_count: number | null
          following_count: number | null
          friends_count: number | null
          id: string
          interests: string[] | null
          is_company_account: boolean | null
          location: string | null
          occupation: string | null
          profile_picture_url: string | null
          relationship_status: string | null
          stream_name: string | null
          updated_at: string | null
          user_id: string | null
          username: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          birthday?: string | null
          company_id?: string | null
          company_name?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          display_name?: string | null
          education?: string | null
          followers_count?: number | null
          following_count?: number | null
          friends_count?: number | null
          id?: string
          interests?: string[] | null
          is_company_account?: boolean | null
          location?: string | null
          occupation?: string | null
          profile_picture_url?: string | null
          relationship_status?: string | null
          stream_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          username: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          birthday?: string | null
          company_id?: string | null
          company_name?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          display_name?: string | null
          education?: string | null
          followers_count?: number | null
          following_count?: number | null
          friends_count?: number | null
          id?: string
          interests?: string[] | null
          is_company_account?: boolean | null
          location?: string | null
          occupation?: string | null
          profile_picture_url?: string | null
          relationship_status?: string | null
          stream_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      user_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tagged_by_user_id: string
          tagged_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tagged_by_user_id: string
          tagged_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tagged_by_user_id?: string
          tagged_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      debug_event_live_status: {
        Args: { p_event_id: string }
        Returns: {
          all_participants: Json
          event_id: string
          event_is_live: boolean
          live_count: number
          live_participants: Json
        }[]
      }
      debug_live_status: {
        Args: { p_event_id: string }
        Returns: {
          is_live: boolean
          role: string
          total_count: number
          user_id: string
        }[]
      }
      generate_slug: {
        Args: { event_name: string }
        Returns: string
      }
      get_event_viewer_count: {
        Args: { event_id_param: string }
        Returns: number
      }
      get_user_admin_role: {
        Args: { user_email: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      get_user_admin_role_safe: {
        Args: { user_id_param: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      update_event_live_status_atomic: {
        Args: { p_event_id: string }
        Returns: {
          event_was_live: boolean
          live_participants_count: number
          should_close_room: boolean
        }[]
      }
      update_event_viewer_count_filtered: {
        Args: {
          event_id_param: string
          participant_count: number
          streamer_count?: number
        }
        Returns: undefined
      }
      update_stripe_account_status: {
        Args: {
          account_id: string
          new_status: string
          onboarding_completed: boolean
          payouts_enabled: boolean
        }
        Returns: undefined
      }
      verify_live_participants: {
        Args: { p_event_id: string }
        Returns: {
          live_hosts: number
          live_streamers: number
          total_live: number
          total_participants: number
        }[]
      }
    }
    Enums: {
      admin_role: "owner" | "master" | "manager" | "administrator"
      channel_role: "channel_master" | "channel_admin" | "member"
      report_reason:
        | "spam_scam"
        | "hate_harassment"
        | "sexual_nudity"
        | "violence"
        | "copyright_ip"
        | "misleading"
        | "other"
      report_status: "pending" | "reviewed" | "dismissed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_role: ["owner", "master", "manager", "administrator"],
      channel_role: ["channel_master", "channel_admin", "member"],
      report_reason: [
        "spam_scam",
        "hate_harassment",
        "sexual_nudity",
        "violence",
        "copyright_ip",
        "misleading",
        "other",
      ],
      report_status: ["pending", "reviewed", "dismissed"],
    },
  },
} as const
