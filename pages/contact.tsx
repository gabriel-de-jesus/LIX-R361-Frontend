import Head from "next/head";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      <Head>
        <title>Labadain Contact</title>
      </Head>
      <header className="bg-[#0D0D0D] px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <Link href="/" className="group min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold group-hover:text-white truncate">Labadain LIX-R361</h1>
            <p className="text-xs text-gray-400 group-hover:text-gray-300 truncate">Hafasil ita-nia moris</p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <a href="https://old.labadain.com" className="text-gray-300 hover:text-white" target="_blank" rel="noopener noreferrer">
            Labadain Chat R361
          </a>
          <a href="https://search.labadain.com" className="text-gray-300 hover:text-white" target="_blank" rel="noopener noreferrer">
            Labadain Search
          </a>
          <a href="https://www.timornews.tl" className="text-gray-300 hover:text-white" target="_blank" rel="noopener noreferrer">
            Timor News
          </a>
        </nav>
      </header>
      <main className="flex-1 px-4 lg:px-6 py-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Konversa ho Ami</h2>
        <p className="text-gray-300 mb-4">
          Ami bele transforma ita-nia dadus sai informasaun útil ne'ebé bele apoia ita iha foti desizaun estratéjika sira.
        </p>
        <p className="text-gray-300 mb-4">Ami bele fó solusaun ba:</p>
        <ul className="space-y-2 text-gray-200 text-sm list-disc pl-5 mb-4">
            <li>
                Agentic AI, inklui ba lia-Tetun.
            </li>
            <li>
                Peskiza (search solutions) iha kualkér plataforma dijitál.
            </li>
            <li>
                Sistema personalizadu no automatizadu adopta AI.
            </li>
            <li>
                Inovasaun sistema informasaun sira seluk bazeia-ba siénsia no estadu-da-arte.
            </li>
        </ul>
        <p className="text-gray-300 text-sm">
          Haruka email ba <span className="font-semibold text-white">ola@labadain.com</span> hodi esplika asuntu ne'ebé ita hakarak konversa ho ami. Bele mós vizita ami-nia fatin iha Moris Foun, Comoro, Dili, Timor-Leste.
        </p>
      </main>
    </div>
  );
}
