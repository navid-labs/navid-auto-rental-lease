-- Enable RLS on all tables
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings: public read, sellers can CRUD own
CREATE POLICY "Active listings are viewable by everyone" ON listings FOR SELECT USING (true);
CREATE POLICY "Sellers can create listings" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON listings FOR UPDATE USING (auth.uid() = seller_id);

-- Listing images: public read, listing owners can manage
CREATE POLICY "Listing images are viewable by everyone" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Listing owners can manage images" ON listing_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
);
CREATE POLICY "Listing owners can delete images" ON listing_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
);

-- Chat rooms: participants only
CREATE POLICY "Chat room participants can view" ON chat_rooms FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
CREATE POLICY "Buyers can create chat rooms" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Chat messages: room participants only
CREATE POLICY "Room participants can view messages" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_rooms WHERE id = chat_room_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);
CREATE POLICY "Room participants can send messages" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM chat_rooms WHERE id = chat_room_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);

-- Consultation leads: own leads + admin
CREATE POLICY "Users can view own leads" ON consultation_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create leads" ON consultation_leads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Escrow payments: participants only
CREATE POLICY "Payment participants can view" ON escrow_payments FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
CREATE POLICY "Buyers can create payments" ON escrow_payments FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Favorites: own only
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Notifications: own only
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Service role bypass (for API routes using service key)
-- Note: Prisma uses the service role key via DATABASE_URL, which bypasses RLS by default.
-- These policies protect direct Supabase client access (browser SDK).
