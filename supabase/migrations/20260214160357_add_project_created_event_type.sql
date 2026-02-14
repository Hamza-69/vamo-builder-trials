-- Add 'project_created' to the activity_events event_type check constraint
ALTER TABLE activity_events DROP CONSTRAINT IF EXISTS activity_events_event_type_check;

ALTER TABLE activity_events ADD CONSTRAINT activity_events_event_type_check
  CHECK (event_type IN (
    'prompt', 'update', 'link_linkedin', 'link_github',
    'link_website', 'feature_shipped', 'customer_added',
    'revenue_logged', 'listing_created', 'offer_received',
    'reward_earned', 'reward_redeemed', 'project_created'
  ));
