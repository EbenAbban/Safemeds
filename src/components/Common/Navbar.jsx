"use client";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold text-blue-600">
        SafeMeds
      </Link>
      <div className="space-x-4">
        <Link href="/about" className="hover:text-blue-500">
          About
        </Link>
        <Link href="/contact" className="hover:text-blue-500">
          Contact
        </Link>
        <Link href="/legal" className="hover:text-blue-500">
          Legal
        </Link>
        <Link href="/consult" className="hover:text-blue-500">
          Consult
        </Link>
        <Link href="/chat" className="hover:text-blue-500">
          Chat
        </Link>
        <Link href="/delivery" className="hover:text-blue-500">
          Delivery
        </Link>
        <Link href="/admin" className="hover:text-blue-500">
          Admin
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
