/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Kirish, ro'yxatdan o'tish va parolni tiklash endi bitta sahifada: /auth
    return [
      { source: "/auth/login", destination: "/auth?mode=login", permanent: true },
      { source: "/auth/register", destination: "/auth?mode=register", permanent: true },
      { source: "/auth/verify", destination: "/auth?mode=verify", permanent: true },
      { source: "/auth/forgot-password", destination: "/auth?mode=forgot", permanent: true },
      { source: "/auth/reset-password", destination: "/auth?mode=login", permanent: true },
    ];
  },
};

module.exports = nextConfig;
