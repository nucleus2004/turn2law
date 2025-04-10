export function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Turn2Law
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Home
              </Link>
              <Link
                href="/lawyers"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Find Lawyers
              </Link>
              <Link
                href="/consult"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Consult
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Button asChild>
              <Link href="/consult">Get Legal Consultation</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
 