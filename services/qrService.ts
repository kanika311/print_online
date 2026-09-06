export async function generateShopQRCodeDataUrl(
  shopId: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://printonline-two.vercel.app'
): Promise<string> {
  const shopUrl = `${baseUrl.replace(/\/+$/, '')}/shop/${shopId}`;

  try {
    const qrModule = await import('qrcode');
    const qrLib = (qrModule as any).default || qrModule;
    if (qrLib && typeof qrLib.toDataURL === 'function') {
      const dataUrl = await qrLib.toDataURL(shopUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      return dataUrl;
    }
  } catch (error) {
    console.warn('Local QRCode generator fallback engaged for:', shopUrl);
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shopUrl)}`;
}

export async function generateShopQRCodeSvg(
  shopId: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://printonline-two.vercel.app'
): Promise<string> {
  const shopUrl = `${baseUrl.replace(/\/+$/, '')}/shop/${shopId}`;

  try {
    const qrModule = await import('qrcode');
    const qrLib = (qrModule as any).default || qrModule;
    if (qrLib && typeof qrLib.toString === 'function') {
      const svg = await qrLib.toString(shopUrl, {
        type: 'svg',
        width: 400,
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#ffffff',
        },
      });
      return svg;
    }
  } catch (error) {
    console.warn('Local QRCode SVG fallback engaged for:', shopUrl);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="10" y="50">QR Code</text></svg>`;
}
