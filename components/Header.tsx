import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

const Header = async () => {
  const session = await auth();

  return (
    <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex justify-between gap-5 items-center">
      <Link href="/" className="text-xl font-semibold text-gray-900">
        Sapa Telemed
      </Link>

      <ul className="flex flex-row items-center gap-4">
        {!session ? (
          <li className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/sign-in">Войти</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/sign-up">Зарегистрироваться</Link>
            </Button>
          </li>
        ) : (
          <li>
            <SignOutButton />
          </li>
        )}
      </ul>
    </header>
  );
};

export default Header;
