import { useState, useEffect } from "react";
import { supabase } from "../superbase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null); // doctor/nurse profile row
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRoleAndProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRoleAndProfile(session.user.id);
      else { setRole(null); setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchRoleAndProfile(authId) {
    const { data: userData } = await supabase
      .from("users")
      .select("id, name, email, roles(name)")
      .eq("auth_id", authId)
      .single();

    const roleName = userData?.roles?.name;
    setRole(roleName);

    if (roleName === "Nurse") {
      const { data: nurseData } = await supabase
        .from("nurses")
        .select("id, name, skills, area, availability_status, rating")
        .eq("user_id", userData.id)
        .single();
      setProfile(nurseData);
    } else if (roleName === "Doctor") {
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("id, name, specialization, approval_rights")
        .eq("user_id", userData.id)
        .single();
      setProfile(doctorData);
    } else {
      setProfile(userData);
    }

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, role, profile, loading, signOut };
}