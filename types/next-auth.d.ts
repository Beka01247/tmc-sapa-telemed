import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    fullName: string;
    userType: string;
    organization: string;
    city: string;
    subdivision: string;
    district: string;
    department: string;
    specialization: string;
    avatar?: string;
    iin: string;
    telephone: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      fullName: string;
      userType: string;
      organization: string;
      city: string;
      subdivision: string;
      district: string;
      department: string;
      specialization: string;
      avatar?: string;
      iin: string;
      telephone: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    fullName: string;
    userType: string;
    organization: string;
    city: string;
    subdivision: string;
    district: string;
    department: string;
    specialization: string;
    avatar?: string;
    iin: string;
    telephone: string;
  }
}
