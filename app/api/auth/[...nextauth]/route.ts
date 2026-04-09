import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key);
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/auth',
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const supabase = getSupabase();
        const email = user.email?.toLowerCase();

        if (!email || !user.name) {
          console.error('Missing email or name');
          return false;
        }

        const ADMIN_EMAIL = '07rishuraj@gmail.com';
        if (email !== ADMIN_EMAIL && !email.endsWith('@pilani.bits-pilani.ac.in')) {
          console.error('Unauthorized email domain:', email);
          return false;
        }

        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          console.error('Database error:', selectError);
          return false;
        }

        if (existingUser) {
          return true;
        }

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            name: user.name,
            email: email,
            coins: 1000000,
          });

        if (insertError) {
          console.error('Insert user error:', insertError);
          return false;
        }

        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) || session.user.email;
        session.user.name = (token.name as string) || session.user.name;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
