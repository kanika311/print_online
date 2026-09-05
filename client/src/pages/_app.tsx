import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>PrintPorter — On-Demand Cloud & Cyber Cafe Print Marketplace</title>
        <meta
          name="description"
          content="Connect with nearby print shops and cyber cafes for high-speed document printing, instant live price calculation, camera scan-to-PDF, and door delivery."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
