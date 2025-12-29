import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/ai-avatar.png" type="image/png" />
      </Head>
      <body className="bg-gray-900 text-gray-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
