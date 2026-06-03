
-- 1) Revoke EXECUTE on SECURITY DEFINER functions from public/anon
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_provider_key(uuid, public.ai_provider, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_provider_key(uuid, public.ai_provider) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_provider_key_plaintext(uuid, public.ai_provider) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_workspace_members(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_usage(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_plan_limits(public.workspace_plan) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid) FROM PUBLIC, anon;

-- 2) nova_system_configs: restrict writes to owners
DROP POLICY IF EXISTS "members insert system configs" ON public.nova_system_configs;
DROP POLICY IF EXISTS "members update system configs" ON public.nova_system_configs;
CREATE POLICY "owners insert system configs" ON public.nova_system_configs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id, auth.uid()));
CREATE POLICY "owners update system configs" ON public.nova_system_configs
  FOR UPDATE TO authenticated
  USING (public.is_workspace_owner(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_owner(workspace_id, auth.uid()));

-- 3) workspace_invitations: prevent owners from mutating sensitive fields
CREATE OR REPLACE FUNCTION public.protect_invitation_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.token IS DISTINCT FROM OLD.token
     OR NEW.invited_by IS DISTINCT FROM OLD.invited_by
     OR NEW.accepted_by IS DISTINCT FROM OLD.accepted_by
     OR NEW.accepted_at IS DISTINCT FROM OLD.accepted_at THEN
    RAISE EXCEPTION 'Cannot modify protected invitation fields';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.protect_invitation_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_invitation_fields_trg ON public.workspace_invitations;
CREATE TRIGGER protect_invitation_fields_trg
  BEFORE UPDATE ON public.workspace_invitations
  FOR EACH ROW
  WHEN (current_setting('role', true) <> 'service_role')
  EXECUTE FUNCTION public.protect_invitation_fields();

DROP POLICY IF EXISTS "owners update invitations" ON public.workspace_invitations;
CREATE POLICY "owners update invitations" ON public.workspace_invitations
  FOR UPDATE TO authenticated
  USING (public.is_workspace_owner(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_owner(workspace_id, auth.uid()));

-- 4) workspace_members: remove self-insert; only owners may insert directly.
-- (accept_invitation runs as SECURITY DEFINER and bypasses RLS for invited joins;
-- handle_new_user also runs as SECURITY DEFINER for the initial owner row.)
DROP POLICY IF EXISTS "owner insert members" ON public.workspace_members;
CREATE POLICY "owner insert members" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id, auth.uid()));
