-- Fix RLS security issues by enabling RLS on tables that need it
ALTER TABLE channel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Add basic policies for these tables to fix the security warnings
CREATE POLICY "Users can manage their own channel subscriptions" ON channel_subscriptions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can view channel subscriptions" ON channel_subscriptions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own comment likes" ON comment_likes
  FOR ALL USING (user_profile_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can view comment likes" ON comment_likes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view comments" ON comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (user_profile_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (user_profile_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own post interactions" ON post_interactions
  FOR ALL USING (user_id::uuid = auth.uid());

CREATE POLICY "Authenticated users can view post interactions" ON post_interactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view posts" ON posts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (author_username = (auth.uid())::text);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (author_username = (auth.uid())::text);

CREATE POLICY "Users can manage their own account info" ON user_accounts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "System can create user accounts" ON user_accounts
  FOR INSERT WITH CHECK (true);