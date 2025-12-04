// Main Flash Sale Page

import { NextPage } from 'next';
import Head from 'next/head';
import { FlashSale } from '../components/FlashSale/FlashSale';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Flash Sale Demo - Kafka & Microservices</title>
        <meta name="description" content="Real-time flash sale demo showcasing Kafka event-driven architecture" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <FlashSale />
      </main>
    </>
  );
};

export default Home;
