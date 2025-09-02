import { supabase } from '../utils/supabase/client';
import { UserPlan } from '../types';
import { AuthError } from '@supabase/supabase-js';

export const auth = supabase.auth;

async function getUserRole(userId: string): Promise<string> {
    if (!userId) {
        console.warn('getUserRole called without a userId.');
        return 'Intern';
    }

    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "exact one row not found"
        console.error("Error fetching user role:", error.message);
    }
    return data?.role || 'Intern'; // Default role on error or if no role is found
}

async function getUserPlan(userId: string): Promise<UserPlan | null> {
    const { data, error } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        console.error("Error fetching user plan:", error.message);
        return null;
    }
    return data;
}

export async function getUserData(userId: string) {
    if (!userId) return null;
    const [role, plan] = await Promise.all([
        getUserRole(userId),
        getUserPlan(userId),
    ]);
    return { role, plan };
}

export async function signUpAndCreateUser(email: string, password: string): Promise<{ error: AuthError | null }> {
    const { data: signUpData, error: signUpError } = await auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        return { error: signUpError };
    }

    if (signUpData.user) {
        // This should ideally be a DB trigger, but we do it here for simplicity.
        // Use Promise.all to run user record creation in parallel.
        const [roleResult, usageResult] = await Promise.all([
            supabase.from('user_roles').insert({ user_id: signUpData.user.id, role: 'Intern' }),
            supabase.from('usage_limits').insert({ user_id: signUpData.user.id })
        ]);

        if (roleResult.error) {
            console.error('Failed to create user role:', roleResult.error.message);
            // Optionally handle this error, e.g., by deleting the user to allow them to try again
        }
        if (usageResult.error) {
            console.error('Failed to create usage limit:', usageResult.error.message);
        }
    }
    
    return { error: null };
}

export async function updateUserMetadata(metadata: object) {
    const { error } = await auth.updateUser({ data: metadata });
    if (error) {
        console.error('Failed to update user metadata:', error.message);
    }
}
