/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google 프로필 이미지
      'avatars.githubusercontent.com', // GitHub 프로필 이미지 (필요한 경우)
      'platform-lookaside.fbsbx.com', // Facebook 프로필 이미지 (필요한 경우)
    ],
  },
};

export default nextConfig;
