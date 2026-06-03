
-- Extend plan enum
ALTER TYPE workspace_plan ADD VALUE IF NOT EXISTS 'pro';
ALTER TYPE workspace_plan ADD VALUE IF NOT EXISTS 'business';
