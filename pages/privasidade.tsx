import Head from "next/head";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Polítika Privasidade - Labadain Chat</title>
        <meta
          name="description"
          content="Polítika privasidade ba Labadain Chat iha Tetun."
        />
      </Head>
      <main className="min-h-screen bg-black text-gray-100">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="mb-4 text-2xl font-semibold text-white">
            Polítika Privasidade Labadain Chat
          </h1>
          <p className="mb-4 text-sm text-gray-300">
            Atualiza: 10 Janeiru 2026
          </p>

          <p className="mb-4 text-sm leading-relaxed text-gray-200">
            Labadain Chat (Labadain LIX-R361) nu'udar asistente AI ida-ne'ebé dezenvolve hosi Labadain Innovation eXperience (LIX)
            atu fasilita konversa iha Tetun. Dokumentu ida-ne'e esplika saida mak ami
            halo ho ita-nia dadus ne'ebé ami kolleta. Se ita la konkorda ho politika ida-ne'e,
            favór lalika uza aplikasaun ne'e.
          </p>

          <h2 className="mt-6 mb-2 text-lg font-semibold text-white">
            1. Dadus ne'ebé ami kolleta
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-gray-200">
            Bainhira ita uza Labadain Chat, ami bele rekolla ita-nia dadus hanesan:
          </p>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-200">
            <li>Testu mensajen sira-ne'ebé ita hatama ba chat;</li>
            <li>Informasaun konta hanesan naran, email no imajen perfíl (karik ita fornese);</li>
            <li>Informasaun téknika bázika hanesan enderesu IP, tipu dispozitivu, no browser.</li>
          </ul>

          <h2 className="mt-6 mb-2 text-lg font-semibold text-white">
            2. Oinsá ami uza ita-nia dadus
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-gray-200">
            Ami sei uza ita-nia dadus atu:
          </p>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-200">
            <li>Fó resposta hosi asistente AI ba ita-nia pergunta sira;</li>
            <li>Manten iha istóriku chat atu foti filafali no disponibiliza ba ita-boot;</li>
            <li>Estuda no hadi'ak kualidade servisu Labadain Chat nian;</li>
            <li>Haforsa seguransa no prevensaun ba uza la tuir objetivu hosi aplikasaun nian.</li>
          </ul>

          <h2 className="mt-6 mb-2 text-lg font-semibold text-white">
            3. Partilla dadus
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-200">
            Ami la fahe ita-nia dadus pesoál ba parte terseiru atu halo marketing
            privadu. Dadus bele partilla ho servisu tékniku de'it atu halo analiza no hadi'ak Labadain Chat nia funsionalidade sira.
          </p>

          <h2 className="mt-6 mb-2 text-lg font-semibold text-white">
            4. Seguransa
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-200">
            Ami halo esforsu atu proteje ita-nia dadus hosi asesu la autorizadu,
            maibé la iha seguransa ne'ebé perfeitu iha internet. Favór labele tau
            informasaun sensível demais iha chat (hanesan númeru kartaun bankária ka
            dokumentu segredu sira).
          </p>

          <h2 className="mt-6 mb-2 text-lg font-semibold text-white">
            5. Ita-nia direitu sira
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-200">
            Se ita hakarak husu klarifikasaun kona-ba ita-nia dadus ka
            husu atu apaga, ita bele kontaktu ami liuhusi email
            ofisiál Labadain.
          </p>

          <h2 className="mt-6 mb-2 text-lg font-semibold text-white">
            6. Kontaktu
          </h2>
          <p className="mb-1 text-sm leading-relaxed text-gray-200">
            Se iha dúvida ka komentáriu kona-ba politika privasidade ida-ne'e,
            ita bele kontaktu ami liuhusi:
          </p>
          <p className="mb-8 text-sm text-gray-200">
            Email: apoiu@labadain.com
          </p>

          <p className="text-xs text-gray-500">
            Labadain bele muda politika privasidade ida-ne'e bainhira de'it.
            Versaun ne'e mak hosi data ne'ebé hatudu iha leten.
          </p>
        </div>
      </main>
    </>
  );
}
