"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Deleting your own account: removes the person's writing and then the auth
 * user itself, which needs the service role. Only ever acts on the caller.
 */
export async function deleteOwnAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const service = createServiceClient();

  const { error: reflectionsError } = await service
    .from("reflections")
    .delete()
    .eq("user_id", user.id);
  if (reflectionsError) return { error: reflectionsError.message };

  await service.from("journals").delete().eq("user_id", user.id);
  await service.from("profiles").delete().eq("user_id", user.id);

  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  return { success: true };
}
